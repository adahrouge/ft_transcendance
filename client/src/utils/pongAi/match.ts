import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { boardCustomizationService } from "../../services/boardCustomization";
import { statsService } from "../../services/stats";
import {
  PongAI,
  clamp,
  BALL_SPEEDS,
  AI_DIFFICULTY_LABELS,
  getAIConfigFromDifficulty,
  renderGame,
  setupTouchControls,
  startCountdown,
} from "../pong";
import { createGameCanvas, createGameOverScreen } from "../../components/pongAi";
import { pongAiState } from "./state";
import { showAiMatchSetup } from "./matchSetup";

export async function startAiMatch(root: HTMLElement, CONFIG: any) {
  const customization = await boardCustomizationService.loadCustomization();
  
  root.innerHTML = createGameCanvas(CONFIG);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEEDS[pongAiState.selectedBallSpeed];
  const aiConfig = getAIConfigFromDifficulty(pongAiState.selectedAIDifficulty);

  let playerX = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let aiX = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let ballX = CONFIG.width / 2;
  let ballY = CONFIG.height / 2;
  let ballVX = (Math.random() < 0.5 ? 1 : -1) * ballSpeed * 0.5;
  let ballVY = -ballSpeed;
  let scorePlayer = 0;
  let scoreAI = 0;
  let paused = false;
  let gameStarted = false;
  let servePaused = false;

  const keys = { left: false, right: false };
  const aiKeys = { left: false, right: false };

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
    baseBallSpeed: ballSpeed,
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

  setupTouchControls(document.getElementById("ai-player-left"), document.getElementById("ai-player-right"), keys);

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    teardown();
    showAiMatchSetup(root, CONFIG);
  });

  let last = 0;
  let acc = 0;
  const dt = 1000 / 60;

  if (pongAiState.globalRaf !== null) {
    cancelAnimationFrame(pongAiState.globalRaf);
    pongAiState.globalRaf = null;
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
      endMatch();
      return;
    }

    pongAiState.globalRaf = requestAnimationFrame(frame);
  }

  function updateAIVision(nowMs: number) {
    if (nowMs >= nextVisionTs) {
      sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };
      nextVisionTs = nowMs + VISION_MS;
    }
  }

  function step(dtSec: number, nowMs: number) {
    if (paused || !gameStarted || servePaused) return;

    updateAIVision(nowMs);

    if (keys.left) playerX -= CONFIG.paddleSpeed * dtSec;
    if (keys.right) playerX += CONFIG.paddleSpeed * dtSec;
    playerX = clamp(playerX, 0, CONFIG.width - CONFIG.paddleW);

    ai.update(dtSec, nowMs, aiX, sampledBall, scoreAI, scorePlayer);

    const snap = ai.getSnapshot();
    const aiDesiredCenter = (snap.targetX ?? aiX) + CONFIG.paddleW / 2;
    const aiCenter = aiX + CONFIG.paddleW / 2;
    const deadband = 3;
    aiKeys.left = aiCenter > aiDesiredCenter + deadband;
    aiKeys.right = aiCenter < aiDesiredCenter - deadband;

    if (aiKeys.left) aiX -= CONFIG.paddleSpeed * dtSec;
    if (aiKeys.right) aiX += CONFIG.paddleSpeed * dtSec;
    aiX = clamp(aiX, 0, CONFIG.width - CONFIG.paddleW);

    ballX += ballVX * dtSec;
    ballY += ballVY * dtSec;

    const halfBall = CONFIG.ballSize / 2;

    if (ballX - halfBall <= 4 && ballVX < 0) {
      ballVX *= -1;
      ballX = 4 + halfBall;
    }
    if (ballX + halfBall >= CONFIG.width - 4 && ballVX > 0) {
      ballVX *= -1;
      ballX = CONFIG.width - 4 - halfBall;
    }

    const aiPaddleY = 10;
    if (ballY - halfBall <= aiPaddleY + CONFIG.paddleH && ballVY < 0) {
      if (ballX >= aiX && ballX <= aiX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (aiX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        const aiVx = ai.onContact(ballX);
        ballVX = 0.55 * (rel * ballSpeed) + 0.45 * aiVx;

        const speed = Math.hypot(ballVX, ballVY);
        const cap = ballSpeed * 1.2;
        if (speed > cap) {
          const s = cap / speed;
          ballVX *= s;
          ballVY *= s;
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
        ballVX = rel * ballSpeed;
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
      ballVX = (Math.random() * 2 - 1) * ballSpeed * 0.5;
      ballVY = dir * ballSpeed;
      servePaused = false;
    }, 1000);
  }

  function isOver() {
    return scorePlayer >= CONFIG.scoreToWin || scoreAI >= CONFIG.scoreToWin;
  }

  async function endMatch() {
    teardown();
    const won = scorePlayer >= CONFIG.scoreToWin;

    if (isAuthenticated()) {
      try {
        await statsService.saveOfflineMatch({
          playerScore: scorePlayer,
          aiScore: scoreAI,
          result: won ? 'win' : 'loss',
          difficulty: AI_DIFFICULTY_LABELS[Math.floor(pongAiState.selectedAIDifficulty / 50)] || 'CUSTOM'
        });
      } catch {
        // Failed to save stats
      }
    }

    root.innerHTML = createGameOverScreen(won, scorePlayer, scoreAI);

    document.getElementById("btn-rematch")?.addEventListener("click", () => {
      startAiMatch(root, CONFIG);
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      navigateTo("/pong");
    });
  }

  function teardown() {
    if (pongAiState.globalRaf !== null) {
      cancelAnimationFrame(pongAiState.globalRaf);
      pongAiState.globalRaf = null;
    }
    window.removeEventListener("keydown", keyDown, { capture: true } as EventListenerOptions);
    window.removeEventListener("keyup", keyUp, { capture: true } as EventListenerOptions);
  }

  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    last = performance.now();
    pongAiState.globalRaf = requestAnimationFrame(frame);
  });
}
