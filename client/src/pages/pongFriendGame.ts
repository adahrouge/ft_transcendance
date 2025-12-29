import {
  DEFAULT_GAME_CONFIG,
  clamp,
  BALL_SPEEDS,
  AI_DIFFICULTY_LABELS,
  renderGame,
  setupTouchControls,
  startCountdown,
  type BallSpeedLevel,
} from "../utils/pong.ts";
import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import { boardCustomizationService } from "../services/boardCustomization";
import { statsService } from "../services/stats";
import "../styles/pong.css";

let selectedBallSpeed: BallSpeedLevel = "normal";
let selectedAIDifficulty: number = 50;
let globalRaf: number | null = null;

const CONFIG = DEFAULT_GAME_CONFIG;


export function renderFriendGamePage(): string {
  setTimeout(() => {
    setupFriendGame();
  }, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

function setupFriendGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    root.innerHTML = `
      <div class="pong-start-box">
        <h1 class="pong-title">${i18n.t('play_pong_title')}</h1>
        <p class="pong-subtitle">${i18n.t('must_login')}</p>
        <div class="pong-controls">
          <button class="pong-btn pong-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
        </div>
        <div class="pong-controls">
          <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
        </div>
      </div>
    `;
    document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
    return;
  }

  showFriendMatchSetup(root);
}

function showFriendMatchSetup(root: HTMLElement) {
  root.innerHTML = `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('vs_friend')}</h1>
      <p class="pong-subtitle">${i18n.t('controls_friend').replace('5', String(CONFIG.scoreToWin))}</p>

      <div class="pong-settings">
        <div class="pong-setting-row">
          <span class="pong-setting-label">BALL SPEED</span>
          <div class="pong-setting-options">
            <button class="pong-setting-btn ${selectedBallSpeed === "slow" ? "active" : ""}" data-speed="slow">SLOW</button>
            <button class="pong-setting-btn ${selectedBallSpeed === "normal" ? "active" : ""}" data-speed="normal">NORMAL</button>
            <button class="pong-setting-btn ${selectedBallSpeed === "fast" ? "active" : ""}" data-speed="fast">FAST</button>
          </div>
        </div>
      </div>

      <div class="pong-divider"></div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-fullwidth" id="btn-start">START MATCH</button>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
      <p class="pong-info">Press SPACE to pause</p>
    </div>
  `;

  document.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedBallSpeed = (btn as HTMLElement).dataset.speed as BallSpeedLevel;
      document.querySelectorAll("[data-speed]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.getElementById("btn-start")?.addEventListener("click", () => startFriendMatch(root));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/pong"));
}

async function startFriendMatch(root: HTMLElement) {
  const customization = await boardCustomizationService.loadCustomization();
  root.innerHTML = `
    <div class="pong-box">
      <div class="pong-scoreboard">
        <div>
          <div class="pong-score-label">${i18n.t('p1')}</div>
          <div class="pong-score-value" id="score-p1">0</div>
        </div>
        <div class="pong-score-divider">:</div>
        <div>
          <div class="pong-score-label">${i18n.t('p2')}</div>
          <div class="pong-score-value" id="score-p2">0</div>
        </div>
      </div>
      <div class="pong-canvas-wrapper">
        <canvas id="game-canvas" width="${CONFIG.width}" height="${CONFIG.height}" class="pong-canvas"></canvas>
        <div class="pong-countdown" id="countdown">
          <span class="pong-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <div class="pong-touch-controls" id="friend-touch-controls">
        <div class="pong-touch-section">
          <span class="pong-touch-label">${i18n.t('p1')}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="friend-p1-left">◄</button>
            <button class="pong-touch-btn" id="friend-p1-right">►</button>
          </div>
        </div>
        <div class="pong-touch-section">
          <span class="pong-touch-label">${i18n.t('p2')}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="friend-p2-left">◄</button>
            <button class="pong-touch-btn" id="friend-p2-right">►</button>
          </div>
        </div>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary" id="btn-pause">PAUSE</button>
        <button class="pong-btn pong-btn-secondary" id="btn-quit">QUIT</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEEDS[selectedBallSpeed];

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
    showFriendMatchSetup(root);
  });

  let last = 0;
  let acc = 0;
  const dt = 1000 / 60;

  if (globalRaf !== null) {
    cancelAnimationFrame(globalRaf);
    globalRaf = null;
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

    globalRaf = requestAnimationFrame(frame);
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

    if (isAuthenticated()) {
      try {
        await statsService.saveOfflineMatch({
          playerScore: scoreP1,
          aiScore: scoreP2,
          result: won ? 'win' : 'loss',
          difficulty: AI_DIFFICULTY_LABELS[Math.floor(selectedAIDifficulty / 50)] || 'CUSTOM'
        });
      } catch {
        // Failed to save stats
      }
    }

    root.innerHTML = `
      <div class="pong-over-overlay">
        <div class="pong-over-box">
          <h1 class="pong-over-title">${won ? i18n.t('player_1_wins') : i18n.t('player_2_wins')}</h1>
          <p class="pong-over-score">${scoreP1} - ${scoreP2}</p>
          <div class="pong-over-actions">
            <button class="pong-btn" id="btn-rematch">REMATCH</button>
            <button class="pong-btn pong-btn-secondary" id="btn-back">BACK</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-rematch")?.addEventListener("click", () => {
      startFriendMatch(root);
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      navigateTo("/pong");
    });
  }

  function teardown() {
    if (globalRaf !== null) {
      cancelAnimationFrame(globalRaf);
      globalRaf = null;
    }
    window.removeEventListener("keydown", keyDown, { capture: true } as EventListenerOptions);
    window.removeEventListener("keyup", keyUp, { capture: true } as EventListenerOptions);
  }

  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    last = performance.now();
    globalRaf = requestAnimationFrame(frame);
  });
}
