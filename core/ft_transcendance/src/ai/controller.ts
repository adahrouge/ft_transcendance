// src/ai/controller.ts
// Deterministic, human-like controller with 1 Hz perception.
// Predicts impact at paddle line with mirrored-wall math, plus hysteresis & deadzone.

export type Snapshot = {
  width: number;
  height: number;

  paddleY: number;   // top-left Y of AI paddle
  paddleH: number;

  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;

  towardAI: boolean; // true if ballVX > 0
};

type Action = 'up' | 'down' | 'none';

export class AIController {
  // Tunables
  private readonly DEADZONE = 8;                 // px: stop moving if within this distance from target center
  private readonly LOCK_IN_X_FRAC = 0.58;        // lock when ball crosses 58% of the table width
  private readonly LOCK_OUT_X_FRAC = 0.46;       // unlock when it retreats to 46% (hysteresis)
  private readonly MAX_LOOK_AHEAD_S = 2.2;       // ignore predictions too far in the future
  private readonly HOME_BIAS = 0;                // extra pull toward center when unlocked
  private readonly SPIN_LEAD = 6;                // add/subtract a few px in ballVY direction
  private readonly EMERGENCY_T_SEC = 0.22;       // if impact is very soon, go full send
  private readonly EMERGENCY_PAD = 2;            // emergency bias to ensure we reach the edge of deadzone

  // Internal lock state
  private locked = false;
  private targetCenter: number | null = null;

  decide(s: Snapshot): Action {
    const W = s.width, H = s.height;
    const centerY = s.paddleY + s.paddleH / 2;
    const midline = W / 2;

    // Paddle face X where collision is tested in your game:
    const aiFaceX = W - (14 + 10); // paddle width=14, right margin≈10 (kept consistent with your game)
    const aiLineX = aiFaceX - 8 - 0.5; // subtract ball radius(8) and tiny epsilon

    // Lock/unlock hysteresis based on ball progress and direction
    const lockInX = this.LOCK_IN_X_FRAC * W;
    const lockOutX = this.LOCK_OUT_X_FRAC * W;

    if (!this.locked && s.towardAI && s.ballX >= lockInX) {
      const hit = this.predictImpactY(s.ballX, s.ballY, s.ballVX, s.ballVY, aiLineX, H);
      if (hit && hit.t <= this.MAX_LOOK_AHEAD_S) {
        this.targetCenter = this.clampCenter(hit.y + Math.sign(s.ballVY || 0) * this.SPIN_LEAD, s.paddleH, H);
        this.locked = true;
      }
    }

    if (this.locked && (!s.towardAI || s.ballX < lockOutX)) {
      this.locked = false;
      this.targetCenter = null;
    }

    // Choose target
    let target = this.locked && this.targetCenter != null
      ? this.targetCenter
      : (H / 2 + this.HOME_BIAS);

    target = this.clampCenter(target, s.paddleH, H);

    // If we have a locked target, and impact is imminent, do emergency
    if (this.locked) {
      const hit = this.predictImpactY(s.ballX, s.ballY, s.ballVX, s.ballVY, aiLineX, H);
      if (hit && hit.t <= this.EMERGENCY_T_SEC) {
        // Recompute final micro-target with a larger nudge to beat corners
        const emgTarget = this.clampCenter(hit.y + Math.sign(s.ballVY || 0) * (this.SPIN_LEAD + this.EMERGENCY_PAD), s.paddleH, H);
        return this.actFor(centerY, emgTarget, this.DEADZONE);
      }
    }

    // Normal action with deadzone
    return this.actFor(centerY, target, this.DEADZONE);
  }

  // Predict Y of the *ball center* at targetX using mirrored-wall reflection
  private predictImpactY(bx: number, by: number, vx: number, vy: number, targetX: number, H: number) {
    if (vx <= 0) return null;
    const t = (targetX - bx) / vx;
    if (t <= 0) return null;

    // "Mirror" technique for vertical bounces
    const min = 8;            // ball radius
    const max = H - 8;
    const rawY = by + vy * t;
    const y = this.reflectY(rawY, min, max);
    return { y, t };
  }

  private reflectY(y: number, min: number, max: number) {
    const span = max - min;
    if (span <= 0) return min;
    let m = (y - min) % (2 * span);
    if (m < 0) m += 2 * span;
    return m <= span ? min + m : min + (2 * span - m);
  }

  private clampCenter(target: number, paddleH: number, H: number) {
    const half = paddleH / 2;
    return Math.max(half, Math.min(H - half, target));
  }

  private actFor(centerY: number, target: number, dead: number): Action {
    const diff = target - centerY;
    if (Math.abs(diff) <= dead) return 'none';
    return diff > 0 ? 'down' : 'up';
  }

  // Call this when a point ends to reset internal intent
  reset(): void {
    this.locked = false;
    this.targetCenter = null;
  }
}
