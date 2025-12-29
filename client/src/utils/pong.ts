import type { AIConfig, BallState, AISnapshot, GameConfig } from "../types/pong";
import type { BoardCustomization } from "../types/boardCustomization";
import { i18n } from "../services/i18n";

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

// ============ Game Settings ============

export type BallSpeedLevel = "slow" | "normal" | "fast";

export const BALL_SPEEDS: Record<BallSpeedLevel, number> = {
  slow: 250,
  normal: 350,
  fast: 500,
};

export const AI_DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"];

export function getAIConfigFromDifficulty(difficulty: number) {
  const t = difficulty / 100;

  const easy = {
    maxSpeed: 280,
    maxAccel: 1200,
    minReactionMs: 300,
    maxReactionMs: 450,
    minJitter: 25,
    maxJitter: 50,
    defocusFrac: 0.45,
    defocusMultiplier: 2.0,
    visionMs: 1200,
    overshootBias: 0.2,
  };

  const medium = {
    maxSpeed: 600,
    maxAccel: 8000,
    minReactionMs: 60,
    maxReactionMs: 120,
    minJitter: 5,
    maxJitter: 15,
    defocusFrac: 0.1,
    defocusMultiplier: 1.2,
    visionMs: 300,
    overshootBias: 0.05,
  };

  const hard = {
    maxSpeed: 1500,
    maxAccel: 80000,
    minReactionMs: 0,
    maxReactionMs: 0,
    minJitter: 0,
    maxJitter: 0,
    defocusFrac: 0.0,
    defocusMultiplier: 1.0,
    visionMs: 0,
    overshootBias: 0.0,
  };

  if (t <= 0.5) {
    const localT = t / 0.5;
    return {
      maxSpeed: lerp(easy.maxSpeed, medium.maxSpeed, localT),
      maxAccel: lerp(easy.maxAccel, medium.maxAccel, localT),
      minReactionMs: lerp(easy.minReactionMs, medium.minReactionMs, localT),
      maxReactionMs: lerp(easy.maxReactionMs, medium.maxReactionMs, localT),
      minJitter: lerp(easy.minJitter, medium.minJitter, localT),
      maxJitter: lerp(easy.maxJitter, medium.maxJitter, localT),
      defocusFrac: lerp(easy.defocusFrac, medium.defocusFrac, localT),
      defocusMultiplier: lerp(easy.defocusMultiplier, medium.defocusMultiplier, localT),
      visionMs: lerp(easy.visionMs, medium.visionMs, localT),
      overshootBias: lerp(easy.overshootBias, medium.overshootBias, localT),
    };
  } else {
    const localT = (t - 0.5) / 0.5;
    return {
      maxSpeed: lerp(medium.maxSpeed, hard.maxSpeed, localT),
      maxAccel: lerp(medium.maxAccel, hard.maxAccel, localT),
      minReactionMs: lerp(medium.minReactionMs, hard.minReactionMs, localT),
      maxReactionMs: lerp(medium.maxReactionMs, hard.maxReactionMs, localT),
      minJitter: lerp(medium.minJitter, hard.minJitter, localT),
      maxJitter: lerp(medium.maxJitter, hard.maxJitter, localT),
      defocusFrac: lerp(medium.defocusFrac, hard.defocusFrac, localT),
      defocusMultiplier: lerp(medium.defocusMultiplier, hard.defocusMultiplier, localT),
      visionMs: lerp(medium.visionMs, hard.visionMs, localT),
      overshootBias: lerp(medium.overshootBias, hard.overshootBias, localT),
    };
  }
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 33) return i18n.t('easy');
  if (difficulty <= 66) return i18n.t('medium');
  return i18n.t('hard');
}

// ============ Shared Game Engine ============

export function renderGame(
  ctx: CanvasRenderingContext2D,
  p1X: number,
  p2X: number,
  ballX: number,
  ballY: number,
  customization: BoardCustomization,
  config: GameConfig = DEFAULT_GAME_CONFIG
) {
  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, config.width, config.height);
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = customization.colors.centerLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, config.height / 2);
  ctx.lineTo(config.width - 10, config.height / 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, config.width - 4, config.height - 4);

  ctx.fillStyle = customization.colors.paddle;
  ctx.fillRect(p2X, 10, config.paddleW, config.paddleH);
  ctx.fillRect(p1X, config.height - config.paddleH - 10, config.paddleW, config.paddleH);
  ctx.fillStyle = customization.colors.ball;
  ctx.fillRect(ballX - config.ballSize / 2, ballY - config.ballSize / 2, config.ballSize, config.ballSize);
}

export interface GameState {
  p1X: number;
  p2X: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  scoreP1: number;
  scoreP2: number;
  paused: boolean;
  gameStarted: boolean;
  servePaused: boolean;
}

export function createGameState(ballSpeed: number, config: GameConfig = DEFAULT_GAME_CONFIG): GameState {
  return {
    p1X: config.width / 2 - config.paddleW / 2,
    p2X: config.width / 2 - config.paddleW / 2,
    ballX: config.width / 2,
    ballY: config.height / 2,
    ballVX: (Math.random() < 0.5 ? 1 : -1) * ballSpeed * 0.5,
    ballVY: (Math.random() < 0.5 ? 1 : -1) * ballSpeed,
    scoreP1: 0,
    scoreP2: 0,
    paused: false,
    gameStarted: false,
    servePaused: false,
  };
}

export function updateBallPhysics(
  state: GameState,
  ballSpeed: number,
  config: GameConfig = DEFAULT_GAME_CONFIG
): { p1Scored: boolean; p2Scored: boolean } {
  const halfBall = config.ballSize / 2;
  let p1Scored = false, p2Scored = false;

  if (state.ballX - halfBall <= 4 && state.ballVX < 0) {
    state.ballVX *= -1;
    state.ballX = 4 + halfBall;
  }
  if (state.ballX + halfBall >= config.width - 4 && state.ballVX > 0) {
    state.ballVX *= -1;
    state.ballX = config.width - 4 - halfBall;
  }

  const p2PaddleY = 10;
  if (state.ballY - halfBall <= p2PaddleY + config.paddleH && state.ballVY < 0) {
    if (state.ballX >= state.p2X && state.ballX <= state.p2X + config.paddleW) {
      state.ballVY *= -1;
      const rel = (state.ballX - (state.p2X + config.paddleW / 2)) / (config.paddleW / 2);
      state.ballVX = rel * ballSpeed;
      state.ballY = p2PaddleY + config.paddleH + halfBall;
    }
  }

  if (state.ballY + halfBall < 0) {
    p1Scored = true;
  }

  const p1PaddleY = config.height - config.paddleH - 10;
  if (state.ballY + halfBall >= p1PaddleY && state.ballVY > 0) {
    if (state.ballX >= state.p1X && state.ballX <= state.p1X + config.paddleW) {
      state.ballVY *= -1;
      const rel = (state.ballX - (state.p1X + config.paddleW / 2)) / (config.paddleW / 2);
      state.ballVX = rel * ballSpeed;
      state.ballY = p1PaddleY - halfBall;
    }
  }

  if (state.ballY - halfBall > config.height) {
    p2Scored = true;
  }

  return { p1Scored, p2Scored };
}

export function setupTouchControls(
  btnLeft: HTMLElement | null,
  btnRight: HTMLElement | null,
  keys: { left: boolean; right: boolean }
) {
  if (btnLeft) {
    btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); keys.left = true; });
    btnLeft.addEventListener("touchend", (e) => { e.preventDefault(); keys.left = false; });
    btnLeft.addEventListener("mousedown", () => keys.left = true);
    btnLeft.addEventListener("mouseup", () => keys.left = false);
  }
  if (btnRight) {
    btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); keys.right = true; });
    btnRight.addEventListener("touchend", (e) => { e.preventDefault(); keys.right = false; });
    btnRight.addEventListener("mousedown", () => keys.right = true);
    btnRight.addEventListener("mouseup", () => keys.right = false);
  }
}

export function startCountdown(
  countdownEl: HTMLDivElement,
  countdownText: HTMLSpanElement,
  seconds: number,
  isPaused: () => boolean,
  onDone: () => void
) {
  let remainingMs = seconds * 1000;
  let lastTs = 0;

  function tick(ts: number) {
    if (!lastTs) lastTs = ts;

    const delta = isPaused() ? 0 : ts - lastTs;
    lastTs = ts;
    remainingMs = Math.max(0, remainingMs - delta);

    const secsInt = Math.ceil(remainingMs / 1000);
    if (secsInt > 0) {
      countdownText.textContent = String(secsInt);
      requestAnimationFrame(tick);
    } else {
      countdownText.textContent = "GO!";
      setTimeout(() => {
        countdownEl.style.display = "none";
        onDone();
      }, 300);
    }
  }

  requestAnimationFrame(tick);
}
