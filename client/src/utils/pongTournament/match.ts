import { PongAI, DEFAULT_GAME_CONFIG, clamp, BALL_SPEEDS, getAIConfigFromDifficulty, renderGame, setupTouchControls, startCountdown } from "../pong";
import { boardCustomizationService } from "../../services/boardCustomization";
import { createMatchCanvas, createMatchResult } from "../../components/pongTournament";
import { getActiveTournament } from "./tournament";
import { advanceWinner } from "./matchLogic";
import { showTournamentBracket } from "./setup";
import { tournamentState } from "./state";

const CONFIG = DEFAULT_GAME_CONFIG;
const BALL_SPEED = BALL_SPEEDS.normal;

export async function startTournamentMatch(
  root: HTMLElement,
  roundIndex: number,
  matchIndex: number,
  aiDifficulty: number,
  aiName: string
) {
  const customization = await boardCustomizationService.loadCustomization();

  root.innerHTML = createMatchCanvas(CONFIG, aiName);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const baseBallSpeed = BALL_SPEED;
  const aiConfig = getAIConfigFromDifficulty(aiDifficulty);

  const SPEED_INCREASE_INTERVAL = 10000;
  const SPEED_INCREASE_RATE = 0.15;
  const MAX_SPEED_MULTIPLIER = 3.0;
  let gameStartTime = 0;

  function getSpeedMultiplier(): number {
    if (!gameStarted || gameStartTime === 0) return 1.0;
    const elapsed = performance.now() - gameStartTime;
    const intervals = Math.floor(elapsed / SPEED_INCREASE_INTERVAL);
    const multiplier = 1.0 + (intervals * SPEED_INCREASE_RATE);
    return Math.min(multiplier, MAX_SPEED_MULTIPLIER);
  }

  function getCurrentBallSpeed(): number {
    return baseBallSpeed * getSpeedMultiplier();
  }

  let playerX = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let aiX = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let ballX = CONFIG.width / 2;
  let ballY = CONFIG.height / 2;
  let ballVX = (Math.random() < 0.5 ? 1 : -1) * baseBallSpeed * 0.5;
  let ballVY = -baseBallSpeed;
  let scorePlayer = 0;
  let scoreAI = 0;
  let paused = false;
  let gameStarted = false;
  let servePaused = false;

  const keys = { left: false, right: false };

  const VISION_MS = aiConfig.visionMs;
  let nextVisionTs = 0;
  let sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };

  const ai = new PongAI({
    tableW: CONFIG.width,
    tableH: CONFIG.height,
    paddleW: CONFIG.paddleW,
    paddleH: CONFIG.paddleH,
    paddleY: 10,
    ballSize: CONFIG.ballSize,
    baseBallSpeed: baseBallSpeed,
    maxSpeed: aiConfig.maxSpeed,
    maxAccel: aiConfig.maxAccel,
    reactionMs: 180,
    aimJitter: 18,
    steadyJitter: 1.25,
    overshootBias: aiConfig.overshootBias,
    minReactionMs: aiConfig.minReactionMs,
    maxReactionMs: aiConfig.maxReactionMs,
    minJitter: aiConfig.minJitter,
    maxJitter: aiConfig.maxJitter,
    focusCycleMs: 2600,
    defocusFrac: aiConfig.defocusFrac,
    defocusMultiplier: aiConfig.defocusMultiplier,
  });

  function updateScoreboard() {
    const playerEl = document.getElementById("score-player");
    const aiEl = document.getElementById("score-ai");
    if (playerEl) playerEl.textContent = String(scorePlayer);
    if (aiEl) aiEl.textContent = String(scoreAI);
  }

  function keyDown(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === " ") paused = !paused;
  }

  function keyUp(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  }

  window.addEventListener("keydown", keyDown, { capture: true });
  window.addEventListener("keyup", keyUp, { capture: true });

  setupTouchControls(document.getElementById("tournament-player-left"), document.getElementById("tournament-player-right"), keys);

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-withdraw")?.addEventListener("click", () => {
    withdrawFromMatch();
  });

  function withdrawFromMatch() {
    teardown();

    const activeTournament = getActiveTournament();
    if (!activeTournament) return;

    const match = activeTournament.bracket[roundIndex][matchIndex];

    if (match.p1?.isPlayer) {
      match.p1Score = scorePlayer;
      match.p2Score = CONFIG.scoreToWin;
      match.winner = match.p2;
    } else {
      match.p1Score = CONFIG.scoreToWin;
      match.p2Score = scorePlayer;
      match.winner = match.p1;
    }

    advanceWinner(roundIndex, matchIndex);
    showTournamentBracket(root);
  }

  const dt = 1000 / 60;
  let acc = 0;
  let last = performance.now();

  function stopRaf() {
    if (tournamentState.globalRaf !== null) {
      cancelAnimationFrame(tournamentState.globalRaf);
      tournamentState.globalRaf = null;
    }
  }

  function frame(now: number) {
    if (!document.body.contains(canvas)) {
      teardown();
      return;
    }

    const elapsed = now - last;
    last = now;
    acc += elapsed;

    while (acc >= dt) {
      step(dt / 1000, now);
      acc -= dt;
    }

    render();

    if (isOver()) {
      endTournamentMatch();
      return;
    }

    tournamentState.globalRaf = requestAnimationFrame(frame);
  }

  function updateAIVision(nowMs: number) {
    if (nowMs >= nextVisionTs) {
      sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };
      nextVisionTs = nowMs + VISION_MS;
    }
  }

  function step(dtSec: number, nowMs: number) {
    if (paused || !gameStarted || servePaused) return;

    if (keys.left) playerX -= CONFIG.paddleSpeed * dtSec;
    if (keys.right) playerX += CONFIG.paddleSpeed * dtSec;
    playerX = clamp(playerX, 0, CONFIG.width - CONFIG.paddleW);

    updateAIVision(nowMs);
    ai.update(dtSec, nowMs, aiX, sampledBall, scoreAI, scorePlayer);

    const snap = ai.getSnapshot();
    const aiDesiredCenter = (snap.targetX ?? aiX) + CONFIG.paddleW / 2;
    const aiCenter = aiX + CONFIG.paddleW / 2;
    const deadband = 3;
    const aiKeysLocal = { left: false, right: false };
    aiKeysLocal.left = aiCenter > aiDesiredCenter + deadband;
    aiKeysLocal.right = aiCenter < aiDesiredCenter - deadband;

    if (aiKeysLocal.left) aiX -= CONFIG.paddleSpeed * dtSec;
    if (aiKeysLocal.right) aiX += CONFIG.paddleSpeed * dtSec;
    aiX = clamp(aiX, 0, CONFIG.width - CONFIG.paddleW);

    const currentSpeed = getCurrentBallSpeed();
    const currentBallSpeed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
    if (currentBallSpeed > 0 && Math.abs(currentBallSpeed - currentSpeed) > 0.1) {
      ballVX = (ballVX / currentBallSpeed) * currentSpeed;
      ballVY = (ballVY / currentBallSpeed) * currentSpeed;
    }

    ballX += ballVX * dtSec;
    ballY += ballVY * dtSec;

    const halfBall = CONFIG.ballSize / 2;

    if (ballX - halfBall < 0) {
      ballX = halfBall;
      ballVX *= -1;
    }
    if (ballX + halfBall > CONFIG.width) {
      ballX = CONFIG.width - halfBall;
      ballVX *= -1;
    }

    const aiPaddleY = 10;
    if (ballY - halfBall <= aiPaddleY + CONFIG.paddleH && ballVY < 0) {
      if (ballX >= aiX && ballX <= aiX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (aiX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * currentSpeed;
        const speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
        if (speed > 0) {
          ballVX = (ballVX / speed) * currentSpeed;
          ballVY = (ballVY / speed) * currentSpeed;
        }
        ballY = aiPaddleY + CONFIG.paddleH + halfBall;
      }
    }

    if (ballY + halfBall < 0) {
      scorePlayer++;
      serve(1);
    }

    const playerPaddleY = CONFIG.height - CONFIG.paddleH - 10;
    if (ballY + halfBall >= playerPaddleY && ballVY > 0) {
      if (ballX >= playerX && ballX <= playerX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (playerX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * currentSpeed;
        const speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
        if (speed > 0) {
          ballVX = (ballVX / speed) * currentSpeed;
          ballVY = (ballVY / speed) * currentSpeed;
        }
        ballY = playerPaddleY - halfBall;
      }
    }

    if (ballY - halfBall > CONFIG.height) {
      scoreAI++;
      serve(-1);
    }

    updateScoreboard();
  }

  function render() {
    renderGame(ctx, playerX, aiX, ballX, ballY, customization);
  }

  function serve(dir: number) {
    servePaused = true;
    ballX = CONFIG.width / 2;
    ballY = CONFIG.height / 2;
    ballVX = 0;
    ballVY = 0;

    countdownEl.style.display = "flex";
    countdownText.textContent = "●";

    setTimeout(() => {
      countdownEl.style.display = "none";
      const serveSpeed = getCurrentBallSpeed();
      ballVX = (Math.random() * 2 - 1) * serveSpeed * 0.5;
      ballVY = dir * serveSpeed;
      const speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      if (speed > 0) {
        ballVX = (ballVX / speed) * serveSpeed;
        ballVY = (ballVY / speed) * serveSpeed;
      }
      servePaused = false;
    }, 1000);
  }

  function isOver() {
    return scorePlayer >= CONFIG.scoreToWin || scoreAI >= CONFIG.scoreToWin;
  }

  function endTournamentMatch() {
    teardown();

    const activeTournament = getActiveTournament();
    if (!activeTournament) return;

    const match = activeTournament.bracket[roundIndex][matchIndex];
    const playerWon = scorePlayer >= CONFIG.scoreToWin;

    if (match.p1?.isPlayer) {
      match.p1Score = scorePlayer;
      match.p2Score = scoreAI;
      match.winner = playerWon ? match.p1 : match.p2;
    } else {
      match.p1Score = scoreAI;
      match.p2Score = scorePlayer;
      match.winner = playerWon ? match.p2 : match.p1;
    }

    advanceWinner(roundIndex, matchIndex);

    root.innerHTML = createMatchResult(playerWon, scorePlayer, scoreAI);

    document.getElementById("btn-continue")?.addEventListener("click", () => {
      showTournamentBracket(root);
    });
  }

  function teardown() {
    stopRaf();
    window.removeEventListener("keydown", keyDown, { capture: true } as EventListenerOptions);
    window.removeEventListener("keyup", keyUp, { capture: true } as EventListenerOptions);
  }

  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    gameStartTime = performance.now();
    last = performance.now();
    tournamentState.globalRaf = requestAnimationFrame(frame);
  });
}
