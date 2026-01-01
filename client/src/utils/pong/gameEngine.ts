import type { GameConfig, SharedGameState } from "../../types/pong";
import type { BoardCustomization } from "../../types/boardCustomization";
import { DEFAULT_GAME_CONFIG } from "./config";

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

export function createGameState(ballSpeed: number, config: GameConfig = DEFAULT_GAME_CONFIG): SharedGameState {
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
  state: SharedGameState,
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
