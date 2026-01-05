import { navigateTo } from "../../router";
import { boardCustomizationService } from "../../services/boardCustomization";
import { statsService } from "../../services/stats";
import {
  clamp,
  BALL_SPEEDS,
  renderGame,
  setupTouchControls,
  startCountdown,
} from "../pong";
import { createGameCanvas, createGameOverScreen } from "../../components/pongFriendGame";
import { pongFriendState } from "./state";
import { showFriendMatchSetup } from "./matchSetup";

export async function startFriendMatch(root: HTMLElement, CONFIG: any) {
  const customization = await boardCustomizationService.loadCustomization();
  
  root.innerHTML = createGameCanvas(CONFIG);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEEDS[pongFriendState.selectedBallSpeed];

  let p1X = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let p2X = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let ballX = CONFIG.width / 2;
  let ballY = CONFIG.height / 2;
  let ballVX = (Math.random() < 0.5 ? 1 : -1) * ballSpeed * 0.5;
  let ballVY = (Math.random() < 0.5 ? 1 : -1) * ballSpeed;
  let scoreP1 = 0;
  let scoreP2 = 0;
  let paused = false;
  let gameStarted = false;
  let servePaused = false;

  const p1Keys = { left: false, right: false };
  const p2Keys = { left: false, right: false };

  function updateScoreboard() {
    const p1El = document.getElementById("score-p1");
    const p2El = document.getElementById("score-p2");
    if (p1El) p1El.textContent = String(scoreP1);
    if (p2El) p2El.textContent = String(scoreP2);
  }

  function keyDown(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "a" || e.key === "A") p1Keys.left = true;
    if (e.key === "d" || e.key === "D") p1Keys.right = true;
    if (e.key === "ArrowLeft") p2Keys.left = true;
    if (e.key === "ArrowRight") p2Keys.right = true;
    if (e.key === " ") paused = !paused;
  }

  function keyUp(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "a" || e.key === "A") p1Keys.left = false;
    if (e.key === "d" || e.key === "D") p1Keys.right = false;
    if (e.key === "ArrowLeft") p2Keys.left = false;
    if (e.key === "ArrowRight") p2Keys.right = false;
  }

  window.addEventListener("keydown", keyDown, { capture: true });
  window.addEventListener("keyup", keyUp, { capture: true });

  setupTouchControls(document.getElementById("friend-p1-left"), document.getElementById("friend-p1-right"), p1Keys);
  setupTouchControls(document.getElementById("friend-p2-left"), document.getElementById("friend-p2-right"), p2Keys);

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    teardown();
    showFriendMatchSetup(root, CONFIG);
  });

  let last = 0;
  let acc = 0;
  const dt = 1000 / 60;

  if (pongFriendState.globalRaf !== null) {
    cancelAnimationFrame(pongFriendState.globalRaf);
    pongFriendState.globalRaf = null;
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
      step(dt / 1000);
      acc -= dt;
    }

    render();

    if (isOver()) {
      endMatch();
      return;
    }

    pongFriendState.globalRaf = requestAnimationFrame(frame);
  }

  function step(dtSec: number) {
    if (paused || !gameStarted || servePaused) return;

    if (p1Keys.left) p1X -= CONFIG.paddleSpeed * dtSec;
    if (p1Keys.right) p1X += CONFIG.paddleSpeed * dtSec;
    p1X = clamp(p1X, 0, CONFIG.width - CONFIG.paddleW);

    if (p2Keys.left) p2X -= CONFIG.paddleSpeed * dtSec;
    if (p2Keys.right) p2X += CONFIG.paddleSpeed * dtSec;
    p2X = clamp(p2X, 0, CONFIG.width - CONFIG.paddleW);

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

    const p2PaddleY = 10;
    if (ballY - halfBall <= p2PaddleY + CONFIG.paddleH && ballVY < 0) {
      if (ballX >= p2X && ballX <= p2X + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (p2X + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = p2PaddleY + CONFIG.paddleH + halfBall;
      }
    }

    if (ballY + halfBall < 0) {
      scoreP1++;
      serve(1);
    }

    const p1PaddleY = CONFIG.height - CONFIG.paddleH - 10;
    if (ballY + halfBall >= p1PaddleY && ballVY > 0) {
      if (ballX >= p1X && ballX <= p1X + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (p1X + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = p1PaddleY - halfBall;
      }
    }

    if (ballY - halfBall > CONFIG.height) {
      scoreP2++;
      serve(-1);
    }

    updateScoreboard();
  }

  function render() {
    renderGame(ctx, p1X, p2X, ballX, ballY, customization);
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
    return scoreP1 >= CONFIG.scoreToWin || scoreP2 >= CONFIG.scoreToWin;
  }

  async function endMatch() {
    teardown();
    const won = scoreP1 >= CONFIG.scoreToWin;

    try {
      await statsService.saveOfflineMatch({
        playerScore: scoreP1,
        aiScore: scoreP2,
        result: won ? 'win' : 'loss',
        difficulty: 'FRIEND'
      });
    } catch {
      // Failed to save stats
    }

    root.innerHTML = createGameOverScreen(won, scoreP1, scoreP2);

    document.getElementById("btn-rematch")?.addEventListener("click", () => {
      startFriendMatch(root, CONFIG);
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      navigateTo("/pong");
    });
  }

  function teardown() {
    if (pongFriendState.globalRaf !== null) {
      cancelAnimationFrame(pongFriendState.globalRaf);
      pongFriendState.globalRaf = null;
    }
    window.removeEventListener("keydown", keyDown, { capture: true } as EventListenerOptions);
    window.removeEventListener("keyup", keyUp, { capture: true } as EventListenerOptions);
  }

  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    last = performance.now();
    pongFriendState.globalRaf = requestAnimationFrame(frame);
  });
}
