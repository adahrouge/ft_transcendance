// src/ai.ts
// A strong-but-fair Pong AI with prediction, reaction, acceleration limits, and adaptive difficulty.

export type AIConfig = {
  // Paddle geometry and arena
  tableW: number;
  tableH: number;
  paddleH: number;
  paddleX: number;   // AI paddle x (left edge)
  ballR: number;

  // Ball
  baseBallSpeed: number;      // reference speed for difficulty scaling

  // Movement model
  maxSpeed: number;           // absolute paddle speed cap (px/s)
  maxAccel: number;           // how fast the paddle can change speed (px/s^2)

  // Human-like traits
  reactionMs: number;         // delay before reacting to new trajectories
  aimJitter: number;          // random mm of target offset (px), reduced when ball is near
  steadyJitter: number;       // small constant tremor in tracking (px)
  overshootBias: number;      // >0 favors slight overshoot like humans “leading” the ball

  // Adaptation
  minReactionMs: number;      // lower bound when losing
  maxReactionMs: number;      // upper bound when winning
  minJitter: number;          // lower bound when losing
  maxJitter: number;          // upper bound when winning

  // “Focus” windows: sometimes the AI drifts a bit and refocuses
  focusCycleMs: number;       // period of focus cycle
  defocusFrac: number;        // fraction of time slightly degraded
  defocusMultiplier: number;  // multiplier to reactionMs and jitter during defocus
};

export type BallState = { x: number; y: number; vx: number; vy: number };
export type AISnapshot = {
  targetY: number;
  predictedY: number | null;
  tracking: 'idle' | 'predicting' | 'centering';
};

export class StrongPaddleAI {
  private cfg: AIConfig;
  private lastSeen: number = 0;           // time when we last “updated” plan (ms)
  private plannedTarget: number = 0;      // y (top of paddle) we’re chasing
  private vy: number = 0;                 // current paddle vertical velocity (px/s)
  private lastBallSig: string = '';       // signature to detect new trajectory
  private snap: AISnapshot = { targetY: 0, predictedY: null, tracking: 'idle' };

  constructor(cfg: AIConfig) {
    this.cfg = cfg;
  }

  getSnapshot(): AISnapshot { return this.snap; }

  /**
   * Predict Y where ball center will cross the AI paddle vertical line.
   * We simulate reflections off top/bottom walls (no friction).
   */
  private predictImpactY(ball: BallState): number | null {
    const { tableW, tableH, paddleX, ballR } = this.cfg;

    if (ball.vx <= 0) return null; // Ball going away -> no prediction

    // Time until ball center reaches the paddle line
    const dx = (paddleX - ball.x) - ballR; // subtract radius so we react when the front reaches paddle
    if (dx <= 0) return null;

    const t = dx / ball.vx; // seconds
    let y = ball.y + ball.vy * t;

    // Reflect across top/bottom virtually
    const top = ballR;
    const bottom = tableH - ballR;
    const span = bottom - top;

    // Map y with “infinite reflections” using triangle-wave folding
    const rel = (y - top) / span;         // relative in [0..∞)
    const k = Math.floor(rel);
    const frac = rel - k;
    const goingDown = (k % 2 === 0);
    const folded = goingDown ? (top + frac * span) : (bottom - frac * span);

    return folded;
  }

  /**
   * Choose a “shot plan” when we are likely to return the ball.
   * We bias to corners and mix in a few center-line change-ups.
   */
  planReturnY(ballY: number): number {
    const { tableH, paddleH } = this.cfg;
    const mid = tableH / 2;
    const third = tableH / 3;

    // Weighted bucket picks
    // 45% aim near corners (with slight safety margin so it doesn’t clip)
    // 35% aim to mid but +/- third to fake-out
    // 20% pure center to reset rallies
    const r = Math.random();
    let aim: number;

    if (r < 0.45) {
      const corner = Math.random() < 0.5 ? (third * 0.6) : (tableH - third * 0.6);
      aim = corner;
    } else if (r < 0.80) {
      aim = mid + (Math.random() < 0.5 ? -third * 0.8 : third * 0.8);
    } else {
      aim = mid;
    }

    // Convert to paddle-top target (we track paddle center to aim point)
    const targetTop = Math.max(0, Math.min(tableH - paddleH, aim - paddleH / 2));
    return targetTop;
  }

  /**
   * Update the AI’s paddle top Y given current ball state and elapsed dt.
   * Returns new paddle top Y (clamped).
   */
  update(dtSec: number, nowMs: number, paddleY: number, ball: BallState, scoreL: number, scoreR: number): number {
    const c = this.cfg;

    // Adapt difficulty based on score diff (losing -> improve, winning -> relax)
    const diff = scoreR - scoreL; // AI is right paddle
    const w = Math.max(-3, Math.min(3, diff)) * (1/3); // normalize to [-1..1]
    const reactionMs = lerp(c.maxReactionMs, c.minReactionMs, Math.max(0, -w)); // losing -> shorter reaction
    const maxReaction = clamp(reactionMs, c.minReactionMs, c.maxReactionMs);

    const baseJitter = lerp(c.maxJitter, c.minJitter, Math.max(0, -w)); // losing -> less jitter
    const focusPhase = (nowMs % c.focusCycleMs) / c.focusCycleMs;
    const isDefocus = focusPhase < c.defocusFrac;
    const reactLag = isDefocus ? maxReaction * c.defocusMultiplier : maxReaction;
    const jitter = (isDefocus ? baseJitter * c.defocusMultiplier : baseJitter);

    // Detect new “trajectory” by velocity + hemisphere
    const ballSig = `${Math.sign(ball.vx)}|${Math.round(ball.vx)}|${Math.round(ball.vy)}`;
    const newTraj = (ballSig !== this.lastBallSig);
    if (newTraj) {
      this.lastBallSig = ballSig;
      this.lastSeen = nowMs;
      // Reset planned target to current center to “wait” out reaction time
      this.plannedTarget = Math.max(0, Math.min(c.tableH - c.paddleH, ball.y - c.paddleH / 2));
      this.snap.tracking = 'idle';
    }

    // Reaction gating: do nothing but small centering drift until reaction window passes
    const reacted = (nowMs - this.lastSeen) >= reactLag;

    if (reacted && ball.vx > 0) {
      // Predict where ball crosses our x
      const pred = this.predictImpactY(ball);
      this.snap.predictedY = pred;

      if (pred != null) {
        // Desired top so paddle center meets predicted Y, with aim/overshoot flavor
        const overshoot = c.overshootBias * Math.sign(ball.vy || 1) * (c.paddleH * 0.15);
        const distanceX = (c.paddleX - ball.x);
        const nearFactor = clamp(1 - distanceX / c.tableW, 0, 1); // 0 far, 1 near
        const closeJitter = jitter * (0.4 + 0.6 * nearFactor);    // reduce jitter as ball nears
        const noise = (Math.random() * 2 - 1) * closeJitter;

        const desiredCenter = pred + overshoot + noise;
        const desiredTop = clamp(desiredCenter - c.paddleH / 2, 0, c.tableH - c.paddleH);

        // Blend current plan toward desired (prevents twitching)
        const blend = 0.75 - 0.35 * nearFactor; // blend less (more decisive) when ball is closer
        this.plannedTarget = desiredTop * (1 - blend) + this.plannedTarget * blend;
        this.snap.tracking = 'predicting';
      } else {
        // Ball going away: drift to a comfortable ready position
        const centerTop = (c.tableH - c.paddleH) * 0.5;
        this.plannedTarget = centerTop;
        this.snap.predictedY = null;
        this.snap.tracking = 'centering';
      }
    } else {
      // Not reacted yet: very light drift toward ball y so it looks “alive”
      const lazyTop = clamp(ball.y - c.paddleH * 0.5, 0, c.tableH - c.paddleH);
      this.plannedTarget = this.plannedTarget * 0.9 + lazyTop * 0.1;
      this.snap.predictedY = null;
      this.snap.tracking = 'idle';
    }

    // Motion integration with acceleration & speed limits
    const target = this.plannedTarget;
    const dy = target - paddleY;
    const wantVy = clamp(dy / dtSec, -c.maxSpeed, c.maxSpeed);

    // accelerate toward wantVy
    const dv = clamp(wantVy - this.vy, -c.maxAccel * dtSec, c.maxAccel * dtSec);
    this.vy = clamp(this.vy + dv, -c.maxSpeed, c.maxSpeed);

    let newY = paddleY + this.vy * dtSec;

    // tiny steady tremor to avoid robotic stillness
    const tremor = (Math.random() * 2 - 1) * this.cfg.steadyJitter * 0.2;
    newY += tremor;

    newY = clamp(newY, 0, c.tableH - c.paddleH);
    this.snap.targetY = target;
    return newY;
  }

  /**
   * On-ball-contact helper: choose a return vy so that the ball tends toward a planned lane.
   * Call this when you detect AI paddle collision to inject a bit of intent.
   */
  onContact(ballY: number): number {
    // After contact, we want to send the ball roughly toward planReturnY target.
    // Map desired center to vy proportionally.
    const desiredTop = this.planReturnY(ballY);
    const desiredCenter = desiredTop + this.cfg.paddleH / 2;
    const rel = clamp((ballY - desiredCenter) / (this.cfg.paddleH / 2), -1, 1);
    // Convert rel to vy fraction of base speed
    return -rel * this.cfg.baseBallSpeed; // negative because hitting above center should drive ball down, etc.
  }
}

// Helpers
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
