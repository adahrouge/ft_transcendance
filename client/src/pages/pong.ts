import {
  PongAI,
  DEFAULT_GAME_CONFIG,
  clamp,
  BALL_SPEEDS,
  AI_DIFFICULTY_LABELS,
  getAIConfigFromDifficulty,
  getDifficultyLabel,
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

// Current settings
let selectedBallSpeed: BallSpeedLevel = "normal";
let selectedAIDifficulty: number = 50; // 0-100 slider
let globalRaf: number | null = null;

const CONFIG = DEFAULT_GAME_CONFIG;

// ============ Page Entry ============

export function renderGamePage(): string {
  setTimeout(() => {
    setupGame();
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

function setupGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  // Check auth
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

  showModeSelection(root);
}

function showModeSelection(root: HTMLElement) {
  root.innerHTML = `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('play_pong_title')}</h1>
      <p class="pong-subtitle">${i18n.t('choose_mode')}</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-vs-ai">
          <span class="pong-mode-title">${i18n.t('vs_ai')}</span>
          <span class="pong-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-vs-friend">
          <span class="pong-mode-title">${i18n.t('vs_friend')}</span>
          <span class="pong-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-tournament">
          <span class="pong-mode-title">${i18n.t('local_tournament')}</span>
          <span class="pong-mode-desc">${i18n.t('local_tournament_desc')}</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-vs-ai")?.addEventListener("click", () => {
    showMatchSetup(root);
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    navigateTo("/pong-friend");
  });

  document.getElementById("btn-tournament")?.addEventListener("click", () => {
    navigateTo("/tournament");
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

function showMatchSetup(root: HTMLElement) {
  root.innerHTML = `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('play_vs_ai')}</h1>
      <p class="pong-subtitle">${i18n.t('controls_ai').replace('5', String(CONFIG.scoreToWin))}</p>

      <div class="pong-settings">
        <div class="pong-setting-row">
          <span class="pong-setting-label">BALL SPEED</span>
          <div class="pong-setting-options">
            <button class="pong-setting-btn ${selectedBallSpeed === "slow" ? "active" : ""}" data-speed="slow">SLOW</button>
            <button class="pong-setting-btn ${selectedBallSpeed === "normal" ? "active" : ""}" data-speed="normal">NORMAL</button>
            <button class="pong-setting-btn ${selectedBallSpeed === "fast" ? "active" : ""}" data-speed="fast">FAST</button>
          </div>
        </div>

        <div class="pong-setting-row">
          <span class="pong-setting-label">${i18n.t('ai_difficulty')}: <span id="difficulty-label">${getDifficultyLabel(selectedAIDifficulty)}</span></span>
          <div class="pong-slider-container">
            <span class="pong-slider-label">${i18n.t('easy')}</span>
            <input type="range" id="difficulty-slider" class="pong-slider" min="0" max="100" value="${selectedAIDifficulty}">
            <span class="pong-slider-label">${i18n.t('hard')}</span>
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

  // Ball speed selection
  document.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedBallSpeed = (btn as HTMLElement).dataset.speed as BallSpeedLevel;
      document.querySelectorAll("[data-speed]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // AI difficulty slider
  const difficultySlider = document.getElementById("difficulty-slider") as HTMLInputElement;
  const difficultyLabel = document.getElementById("difficulty-label");
  difficultySlider?.addEventListener("input", () => {
    selectedAIDifficulty = parseInt(difficultySlider.value, 10);
    if (difficultyLabel) {
      difficultyLabel.textContent = getDifficultyLabel(selectedAIDifficulty);
    }
  });

  document.getElementById("btn-start")?.addEventListener("click", () => startMatch(root));
  document.getElementById("btn-back")?.addEventListener("click", () => showModeSelection(root));
}

async function startMatch(root: HTMLElement) {
  // Load customization
  const customization = await boardCustomizationService.loadCustomization();
  root.innerHTML = `
    <div class="pong-box">
      <div class="pong-scoreboard">
        <div>
          <div class="pong-score-label">${i18n.t('you')}</div>
          <div class="pong-score-value" id="score-player">0</div>
        </div>
        <div class="pong-score-divider">:</div>
        <div>
          <div class="pong-score-label">${i18n.t('ai')}</div>
          <div class="pong-score-value" id="score-ai">0</div>
        </div>
      </div>
      <div class="pong-canvas-wrapper">
        <canvas id="game-canvas" width="${CONFIG.width}" height="${CONFIG.height}" class="pong-canvas"></canvas>
        <div class="pong-countdown" id="countdown">
          <span class="pong-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <!-- Touch controls for mobile -->
      <div class="pong-touch-controls pong-touch-controls-single" id="ai-touch-controls">
        <div class="pong-touch-section pong-touch-single">
          <span class="pong-touch-label">${i18n.t('you')}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="ai-player-left">◄</button>
            <button class="pong-touch-btn" id="ai-player-right">►</button>
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

  // Get current settings
  const ballSpeed = BALL_SPEEDS[selectedBallSpeed];
  const aiConfig = getAIConfigFromDifficulty(selectedAIDifficulty);

  // Game state
  let playerX = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let aiX = CONFIG.width / 2 - CONFIG.paddleW / 2;
  let ballX = CONFIG.width / 2;
  let ballY = CONFIG.height / 2;
  let ballVX = (Math.random() < 0.5 ? 1 : -1) * ballSpeed * 0.5;
  let ballVY = -ballSpeed; // Start moving toward player at bottom
  let scorePlayer = 0;
  let scoreAI = 0;
  let paused = false;
  let gameStarted = false;
  let servePaused = false; // Pause after scoring

  // Keys
  const keys = { left: false, right: false };
  const aiKeys = { left: false, right: false };

  // AI vision throttle - varies with difficulty
  const VISION_MS = aiConfig.visionMs;
  let nextVisionTs = 0;
  let sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };

  // AI setup with selected difficulty
  const ai = new PongAI({
    tableW: CONFIG.width,
    tableH: CONFIG.height,
    paddleW: CONFIG.paddleW,
    paddleH: CONFIG.paddleH,
    paddleY: 10, // AI paddle at top
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

  // Input handlers
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

  // Touch controls for mobile
  setupTouchControls(document.getElementById("ai-player-left"), document.getElementById("ai-player-right"), keys);

  // Button handlers
  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    teardown();
    showMatchSetup(root);
  });

  // Game loop
  let last = 0;
  let acc = 0;
  const dt = 1000 / 60;

  // Cancel any existing loop
  if (globalRaf !== null) {
    cancelAnimationFrame(globalRaf);
    globalRaf = null;
  }

  function frame(now: number) {
    // Safety check: stop if canvas is gone (e.g. navigation)
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

    globalRaf = requestAnimationFrame(frame);
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

    // Player paddle (bottom)
    if (keys.left) playerX -= CONFIG.paddleSpeed * dtSec;
    if (keys.right) playerX += CONFIG.paddleSpeed * dtSec;
    playerX = clamp(playerX, 0, CONFIG.width - CONFIG.paddleW);

    // AI planning and movement (top)
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

    // Ball movement
    ballX += ballVX * dtSec;
    ballY += ballVY * dtSec;

    const halfBall = CONFIG.ballSize / 2;

    // Wall collisions (left/right)
    if (ballX - halfBall <= 4 && ballVX < 0) {
      ballVX *= -1;
      ballX = 4 + halfBall;
    }
    if (ballX + halfBall >= CONFIG.width - 4 && ballVX > 0) {
      ballVX *= -1;
      ballX = CONFIG.width - 4 - halfBall;
    }

    // AI paddle collision (top)
    const aiPaddleY = 10;
    if (ballY - halfBall <= aiPaddleY + CONFIG.paddleH && ballVY < 0) {
      if (ballX >= aiX && ballX <= aiX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (aiX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        const aiVx = ai.onContact(ballX);
        ballVX = 0.55 * (rel * ballSpeed) + 0.45 * aiVx;

        // Clamp speed
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
    
    // Check if ball passed AI paddle (Player scores)
    if (ballY + halfBall < 0) {
      scorePlayer++;
      serve(1);
    }

    // Player paddle collision (bottom)
    const playerPaddleY = CONFIG.height - CONFIG.paddleH - 10;
    if (ballY + halfBall >= playerPaddleY && ballVY > 0) {
      if (ballX >= playerX && ballX <= playerX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (playerX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = playerPaddleY - halfBall;
      }
    }

    // Check if ball passed Player paddle (AI scores)
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
    // Pause briefly after scoring
    servePaused = true;
    ballX = CONFIG.width / 2;
    ballY = CONFIG.height / 2;
    ballVX = 0;
    ballVY = 0;
    
    // Show countdown overlay
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

    // Save match stats if user is authenticated
    if (isAuthenticated()) {
      try {
        await statsService.saveOfflineMatch({
          playerScore: scorePlayer,
          aiScore: scoreAI,
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
          <h1 class="pong-over-title">${won ? i18n.t('you_win') : i18n.t('you_lose')}</h1>
          <p class="pong-over-score">${scorePlayer} - ${scoreAI}</p>
          <div class="pong-over-actions">
            <button class="pong-btn" id="btn-rematch">REMATCH</button>
            <button class="pong-btn pong-btn-secondary" id="btn-back">BACK</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-rematch")?.addEventListener("click", () => {
      startMatch(root);
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      navigateTo("/home");
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

  // Initial render and countdown
  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    last = performance.now();
    globalRaf = requestAnimationFrame(frame);
  });
}
