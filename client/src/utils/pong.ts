import type { AIConfig, BallState, AISnapshot, GameConfig } from "../types/pong";

// Default game configuration for vertical retro pong
export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: 600,
  height: 600,
  paddleW: 80,
  paddleH: 12,
  ballSize: 12,
  paddleSpeed: 400,
  ballSpeed: 350,
  scoreToWin: 5,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// AI for vertical Pong - AI controls bottom paddle, predicts ball X position
export class PongAI {
  private cfg: AIConfig;
  private lastSeen: number = 0;
  private plannedTarget: number = 0;
  private vx: number = 0;
  private lastBallSig: string = "";
  private snap: AISnapshot = { targetX: 0, predictedX: null, tracking: "idle" };

  constructor(cfg: AIConfig) {
    this.cfg = cfg;
  }

  getSnapshot(): AISnapshot {
    return this.snap;
  }

  // Predict X where ball center will cross the AI paddle horizontal line
  private predictImpactX(ball: BallState): number | null {
    const { paddleY, paddleH, ballSize, tableH, tableW } = this.cfg;
    const isTop = paddleY < tableH / 2;

    // Check if ball is moving toward AI
    if (isTop) {
      if (ball.vy >= 0) return null; // Moving down (away)
    } else {
      if (ball.vy <= 0) return null; // Moving up (away)
    }

    // Time until impact
    let t = 0;
    if (isTop) {
      // Impact at bottom of paddle
      const impactY = paddleY + paddleH + ballSize / 2;
      t = (impactY - ball.y) / ball.vy;
    } else {
      // Impact at top of paddle
      const impactY = paddleY - ballSize / 2;
      t = (impactY - ball.y) / ball.vy;
    }

    if (t < 0) return null;

    let x = ball.x + ball.vx * t;

    // Reflect across left/right walls
    const left = ballSize;
    const right = tableW - ballSize;
    const span = right - left;

    // Triangle-wave folding for reflections
    const rel = (x - left) / span;
    const k = Math.floor(rel);
    const frac = rel - k;
    const goingRight = k % 2 === 0;
    const folded = goingRight ? left + frac * span : right - frac * span;

    return folded;
  }

  // Choose return angle plan
  planReturnX(_ballX: number): number {
    const { tableW, paddleW } = this.cfg;
    const mid = tableW / 2;
    const third = tableW / 3;

    const r = Math.random();
    let aim: number;

    if (r < 0.45) {
      const corner = Math.random() < 0.5 ? third * 0.6 : tableW - third * 0.6;
      aim = corner;
    } else if (r < 0.8) {
      aim = mid + (Math.random() < 0.5 ? -third * 0.8 : third * 0.8);
    } else {
      aim = mid;
    }

    const targetLeft = Math.max(0, Math.min(tableW - paddleW, aim - paddleW / 2));
    return targetLeft;
  }

  update(
    dtSec: number,
    nowMs: number,
    paddleX: number,
    ball: BallState,
    scorePlayer: number,
    scoreAI: number
  ): number {
    const c = this.cfg;

    // Adapt difficulty based on score
    const diff = scoreAI - scorePlayer;
    const w = (Math.max(-3, Math.min(3, diff)) * 1) / 3;
    const reactionMs = lerp(c.maxReactionMs, c.minReactionMs, Math.max(0, -w));
    const maxReaction = clamp(reactionMs, c.minReactionMs, c.maxReactionMs);

    const baseJitter = lerp(c.maxJitter, c.minJitter, Math.max(0, -w));
    const focusPhase = (nowMs % c.focusCycleMs) / c.focusCycleMs;
    const isDefocus = focusPhase < c.defocusFrac;
    const reactLag = isDefocus ? maxReaction * c.defocusMultiplier : maxReaction;
    const jitter = isDefocus ? baseJitter * c.defocusMultiplier : baseJitter;

    // Detect new trajectory
    const ballSig = `${Math.sign(ball.vy)}|${Math.round(ball.vx)}|${Math.round(ball.vy)}`;
    const newTraj = ballSig !== this.lastBallSig;
    if (newTraj) {
      this.lastBallSig = ballSig;
      this.lastSeen = nowMs;
      this.plannedTarget = Math.max(0, Math.min(c.tableW - c.paddleW, ball.x - c.paddleW / 2));
      this.snap.tracking = "idle";
    }

    const isTop = c.paddleY < c.tableH / 2;
    const movingTowards = isTop ? ball.vy < 0 : ball.vy > 0;
    const reacted = nowMs - this.lastSeen >= reactLag;

    if (reacted && movingTowards) {
      const pred = this.predictImpactX(ball);
      this.snap.predictedX = pred;

      if (pred != null) {
        const overshoot = c.overshootBias * Math.sign(ball.vx || 1) * (c.paddleW * 0.15);
        const distanceY = c.paddleY - ball.y;
        const nearFactor = clamp(1 - distanceY / c.tableH, 0, 1);
        const closeJitter = jitter * (0.4 + 0.6 * nearFactor);
        const noise = (Math.random() * 2 - 1) * closeJitter;

        const desiredCenter = pred + overshoot + noise;
        const desiredLeft = clamp(desiredCenter - c.paddleW / 2, 0, c.tableW - c.paddleW);

        const blend = 0.75 - 0.35 * nearFactor;
        this.plannedTarget = desiredLeft * (1 - blend) + this.plannedTarget * blend;
        this.snap.tracking = "predicting";
      } else {
        const centerLeft = (c.tableW - c.paddleW) * 0.5;
        this.plannedTarget = centerLeft;
        this.snap.predictedX = null;
        this.snap.tracking = "centering";
      }
    } else {
      const lazyLeft = clamp(ball.x - c.paddleW * 0.5, 0, c.tableW - c.paddleW);
      this.plannedTarget = this.plannedTarget * 0.9 + lazyLeft * 0.1;
      this.snap.predictedX = null;
      this.snap.tracking = "idle";
    }

    // Motion with acceleration limits
    const target = this.plannedTarget;
    const dx = target - paddleX;
    const wantVx = clamp(dx / dtSec, -c.maxSpeed, c.maxSpeed);

    const dv = clamp(wantVx - this.vx, -c.maxAccel * dtSec, c.maxAccel * dtSec);
    this.vx = clamp(this.vx + dv, -c.maxSpeed, c.maxSpeed);

    let newX = paddleX + this.vx * dtSec;

    // Tiny tremor
    const tremor = (Math.random() * 2 - 1) * this.cfg.steadyJitter * 0.2;
    newX += tremor;

    newX = clamp(newX, 0, c.tableW - c.paddleW);
    this.snap.targetX = target;
    return newX;
  }

  onContact(ballX: number): number {
    const desiredLeft = this.planReturnX(ballX);
    const desiredCenter = desiredLeft + this.cfg.paddleW / 2;
    const rel = clamp((ballX - desiredCenter) / (this.cfg.paddleW / 2), -1, 1);
    return -rel * this.cfg.baseBallSpeed;
  }
}
