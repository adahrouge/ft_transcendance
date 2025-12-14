import { PongAI, DEFAULT_GAME_CONFIG, clamp } from "../utils/offlineGame";
import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import { boardCustomizationService } from "../services/boardCustomization";
import type { BoardCustomization } from "../types/boardCustomization";
import { statsService } from "../services/stats";
import "../styles/offlineGame.css";
import backgroundImage from "../assets/images/background.jpg";

// Game settings
type BallSpeedLevel = "slow" | "normal" | "fast";

const BALL_SPEEDS: Record<BallSpeedLevel, number> = {
  slow: 250,
  normal: 350,
  fast: 500,
};

// AI difficulty as a number 0-100 for smooth slider
const AI_DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"];

function getAIConfigFromDifficulty(difficulty: number) {
  // difficulty is 0-100
  // Interpolate between easy (0) -> medium (50) -> hard (100)
  const t = difficulty / 100;

  // Easy config
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

  // Medium config
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

  // Hard config - much smarter AI (God Mode)
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

  // Interpolate based on difficulty
  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  if (t <= 0.5) {
    // Interpolate between easy and medium
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
    // Interpolate between medium and hard
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

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 33) return i18n.t('easy');
  if (difficulty <= 66) return i18n.t('medium');
  return i18n.t('hard');
}

// Game modes
type GameMode = "ai" | "friend";

// Current settings
let selectedBallSpeed: BallSpeedLevel = "normal";
let selectedAIDifficulty: number = 50; // 0-100 slider
let selectedGameMode: GameMode = "ai";
let globalRaf: number | null = null;

const CONFIG = DEFAULT_GAME_CONFIG;

// ============ Shared Drawing Functions ============

function drawTable(ctx: CanvasRenderingContext2D, customization: BoardCustomization) {
  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = customization.colors.centerLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, CONFIG.height / 2);
  ctx.lineTo(CONFIG.width - 10, CONFIG.height / 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, CONFIG.width - 4, CONFIG.height - 4);
}

function drawPaddle(ctx: CanvasRenderingContext2D, x: number, y: number, customization: BoardCustomization) {
  ctx.fillStyle = customization.colors.paddle;
  ctx.fillRect(x, y, CONFIG.paddleW, CONFIG.paddleH);
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, customization: BoardCustomization) {
  ctx.fillStyle = customization.colors.ball;
  ctx.fillRect(
    x - CONFIG.ballSize / 2,
    y - CONFIG.ballSize / 2,
    CONFIG.ballSize,
    CONFIG.ballSize
  );
}

function renderGame(
  ctx: CanvasRenderingContext2D,
  p1X: number,
  p2X: number,
  ballX: number,
  ballY: number,
  customization: BoardCustomization
) {
  drawTable(ctx, customization);
  drawPaddle(ctx, p2X, 10, customization);
  drawPaddle(ctx, p1X, CONFIG.height - CONFIG.paddleH - 10, customization);
  drawBall(ctx, ballX, ballY, customization);
}

// ============ Shared Countdown Function ============

function startCountdown(
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

// ============ Page Entry ============

export function renderGamePage(): string {
  setTimeout(() => {
    setupGame();
  }, 0);

  return `
    <div class="offlineGame-container" style="background-image: url('${backgroundImage}')">
      <div class="offlineGame-overlay"></div>
      <div class="offlineGame-content">
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
      <div class="offlineGame-start-box">
        <h1 class="offlineGame-title">PLAY OFFLINE</h1>
        <p class="offlineGame-subtitle">${i18n.t('must_login')}</p>
        <div class="offlineGame-controls">
          <button class="offlineGame-btn offlineGame-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
        </div>
        <div class="offlineGame-controls">
          <button class="offlineGame-btn offlineGame-btn-secondary offlineGame-btn-fullwidth" id="btn-back">BACK</button>
        </div>
      </div>
    `;
    document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
    return;
  }

  // Show mode selection screen
  showModeSelection(root);
}

function showModeSelection(root: HTMLElement) {
  root.innerHTML = `
    <div class="offlineGame-start-box">
      <h1 class="offlineGame-title">PLAY OFFLINE</h1>
      <p class="offlineGame-subtitle">${i18n.t('choose_mode')}</p>

      <div class="offlineGame-mode-buttons">
        <button class="offlineGame-mode-btn" id="btn-vs-ai">
          <span class="offlineGame-mode-title">${i18n.t('vs_ai')}</span>
          <span class="offlineGame-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="offlineGame-mode-btn" id="btn-vs-friend">
          <span class="offlineGame-mode-title">${i18n.t('vs_friend')}</span>
          <span class="offlineGame-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
      </div>

      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary offlineGame-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-vs-ai")?.addEventListener("click", () => {
    selectedGameMode = "ai";
    showMatchSetup(root);
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    selectedGameMode = "friend";
    showFriendMatchSetup(root);
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

function showMatchSetup(root: HTMLElement) {
  root.innerHTML = `
    <div class="offlineGame-start-box">
      <h1 class="offlineGame-title">${i18n.t('play_vs_ai')}</h1>
      <p class="offlineGame-subtitle">${i18n.t('controls_ai').replace('5', String(CONFIG.scoreToWin))}</p>

      <div class="offlineGame-settings">
        <div class="offlineGame-setting-row">
          <span class="offlineGame-setting-label">BALL SPEED</span>
          <div class="offlineGame-setting-options">
            <button class="offlineGame-setting-btn ${selectedBallSpeed === "slow" ? "active" : ""}" data-speed="slow">SLOW</button>
            <button class="offlineGame-setting-btn ${selectedBallSpeed === "normal" ? "active" : ""}" data-speed="normal">NORMAL</button>
            <button class="offlineGame-setting-btn ${selectedBallSpeed === "fast" ? "active" : ""}" data-speed="fast">FAST</button>
          </div>
        </div>

        <div class="offlineGame-setting-row">
          <span class="offlineGame-setting-label">${i18n.t('ai_difficulty')}: <span id="difficulty-label">${getDifficultyLabel(selectedAIDifficulty)}</span></span>
          <div class="offlineGame-slider-container">
            <span class="offlineGame-slider-label">${i18n.t('easy')}</span>
            <input type="range" id="difficulty-slider" class="offlineGame-slider" min="0" max="100" value="${selectedAIDifficulty}">
            <span class="offlineGame-slider-label">${i18n.t('hard')}</span>
          </div>
        </div>
      </div>

      <div class="offlineGame-divider"></div>

      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-fullwidth" id="btn-start">START MATCH</button>
      </div>
      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary offlineGame-btn-fullwidth" id="btn-back">BACK</button>
      </div>
      <p class="offlineGame-info">Press SPACE to pause</p>
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

function showFriendMatchSetup(root: HTMLElement) {
  root.innerHTML = `
    <div class="offlineGame-start-box">
      <h1 class="offlineGame-title">${i18n.t('vs_friend')}</h1>
      <p class="offlineGame-subtitle">${i18n.t('controls_friend').replace('5', String(CONFIG.scoreToWin))}</p>

      <div class="offlineGame-settings">
        <div class="offlineGame-setting-row">
          <span class="offlineGame-setting-label">BALL SPEED</span>
          <div class="offlineGame-setting-options">
            <button class="offlineGame-setting-btn ${selectedBallSpeed === "slow" ? "active" : ""}" data-speed="slow">SLOW</button>
            <button class="offlineGame-setting-btn ${selectedBallSpeed === "normal" ? "active" : ""}" data-speed="normal">NORMAL</button>
            <button class="offlineGame-setting-btn ${selectedBallSpeed === "fast" ? "active" : ""}" data-speed="fast">FAST</button>
          </div>
        </div>
      </div>

      <div class="offlineGame-divider"></div>

      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-fullwidth" id="btn-start">START MATCH</button>
      </div>
      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary offlineGame-btn-fullwidth" id="btn-back">BACK</button>
      </div>
      <p class="offlineGame-info">Press SPACE to pause</p>
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

  document.getElementById("btn-start")?.addEventListener("click", () => startFriendMatch(root));
  document.getElementById("btn-back")?.addEventListener("click", () => showModeSelection(root));
}

async function startFriendMatch(root: HTMLElement) {
  // Load customization
  const customization = await boardCustomizationService.loadCustomization();
  root.innerHTML = `
    <div class="offlineGame-box">
      <div class="offlineGame-scoreboard">
        <div>
          <div class="offlineGame-score-label">${i18n.t('p1')}</div>
          <div class="offlineGame-score-value" id="score-p1">0</div>
        </div>
        <div class="offlineGame-score-divider">:</div>
        <div>
          <div class="offlineGame-score-label">${i18n.t('p2')}</div>
          <div class="offlineGame-score-value" id="score-p2">0</div>
        </div>
      </div>
      <div class="offlineGame-canvas-wrapper">
        <canvas id="game-canvas" width="${CONFIG.width}" height="${CONFIG.height}" class="offlineGame-canvas"></canvas>
        <div class="offlineGame-countdown" id="countdown">
          <span class="offlineGame-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-pause">PAUSE</button>
        <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-quit">QUIT</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEEDS[selectedBallSpeed];

  // Game state
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

  // Keys for both players
  const p1Keys = { left: false, right: false };
  const p2Keys = { left: false, right: false };

  function updateScoreboard() {
    const p1El = document.getElementById("score-p1");
    const p2El = document.getElementById("score-p2");
    if (p1El) p1El.textContent = String(scoreP1);
    if (p2El) p2El.textContent = String(scoreP2);
  }

  // Input handlers
  function keyDown(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(e.key)) {
      e.preventDefault();
    }
    // Player 1: A/D
    if (e.key === "a" || e.key === "A") p1Keys.left = true;
    if (e.key === "d" || e.key === "D") p1Keys.right = true;
    // Player 2: Arrow keys
    if (e.key === "ArrowLeft") p2Keys.left = true;
    if (e.key === "ArrowRight") p2Keys.right = true;
    // Pause
    if (e.key === " ") paused = !paused;
  }

  function keyUp(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
      e.preventDefault();
    }
    // Player 1: A/D
    if (e.key === "a" || e.key === "A") p1Keys.left = false;
    if (e.key === "d" || e.key === "D") p1Keys.right = false;
    // Player 2: Arrow keys
    if (e.key === "ArrowLeft") p2Keys.left = false;
    if (e.key === "ArrowRight") p2Keys.right = false;
  }

  window.addEventListener("keydown", keyDown, { capture: true });
  window.addEventListener("keyup", keyUp, { capture: true });

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    teardown();
    showFriendMatchSetup(root);
  });

  // Game loop
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
    if (paused || !gameStarted) return;

    // Player 1 paddle (bottom)
    if (p1Keys.left) p1X -= CONFIG.paddleSpeed * dtSec;
    if (p1Keys.right) p1X += CONFIG.paddleSpeed * dtSec;
    p1X = clamp(p1X, 0, CONFIG.width - CONFIG.paddleW);

    // Player 2 paddle (top)
    if (p2Keys.left) p2X -= CONFIG.paddleSpeed * dtSec;
    if (p2Keys.right) p2X += CONFIG.paddleSpeed * dtSec;
    p2X = clamp(p2X, 0, CONFIG.width - CONFIG.paddleW);

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

    // P2 paddle collision (top)
    const p2PaddleY = 10;
    if (ballY - halfBall <= p2PaddleY + CONFIG.paddleH && ballVY < 0) {
      if (ballX >= p2X && ballX <= p2X + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (p2X + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = p2PaddleY + CONFIG.paddleH + halfBall;
      }
    }

    // Ball passed P2 (P1 scores)
    if (ballY + halfBall < 0) {
      scoreP1++;
      serve(1);
    }

    // P1 paddle collision (bottom)
    const p1PaddleY = CONFIG.height - CONFIG.paddleH - 10;
    if (ballY + halfBall >= p1PaddleY && ballVY > 0) {
      if (ballX >= p1X && ballX <= p1X + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (p1X + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = p1PaddleY - halfBall;
      }
    }

    // Ball passed P1 (P2 scores)
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
    ballX = CONFIG.width / 2;
    ballY = CONFIG.height / 2;
    ballVX = (Math.random() * 2 - 1) * ballSpeed * 0.5;
    ballVY = dir * ballSpeed;
  }

  function isOver() {
    return scoreP1 >= CONFIG.scoreToWin || scoreP2 >= CONFIG.scoreToWin;
  }

  async function endMatch() {
    teardown();
    const won = scoreP1 >= CONFIG.scoreToWin;

    // Save match stats if user is authenticated
    if (isAuthenticated()) {
      try {
        // For offline games against AI, we can record it as a match against a bot
        // We'll use a special ID or flag for AI opponent
        // Since the backend expects an opponent ID, we might need to adjust the backend
        // or just not save offline games to the main match history if the backend doesn't support it.
        // However, the user asked to register stats.
        
        // Let's assume we want to track wins/losses locally or send to a specific endpoint if available.
        // Currently the stats service fetches from backend.
        // If we want to save this, we need an endpoint.
        // Since we don't have a specific "offline match" endpoint, we might skip saving to DB 
        // OR we can implement a client-side only storage or a new endpoint.
        
        // Given the prompt "see if they are registreeted in the stats or ot", 
        // and we just fixed the server for online games.
        // Offline games are client-side. To register them in stats (which come from server),
        // we would need to send this result to the server.
        
        // Let's check if we can use the existing match history endpoint.
        // The addMatchHistory in db.js takes (userId, opponentId, ...).
        // If opponentId is null, it might work if the DB allows it.
        // Let's try to send it to a new endpoint we'll create, or just log it for now if we can't change server.
        // But wait, I can change the server.
        
        // I will add a call to a new service method to save offline match.
        await statsService.saveOfflineMatch({
          playerScore: scoreP1,
          aiScore: scoreP2,
          result: won ? 'win' : 'loss',
          difficulty: AI_DIFFICULTY_LABELS[Math.floor(selectedAIDifficulty / 50)] || 'CUSTOM'
        });
      } catch (err) {
        console.error("Failed to save offline match stats:", err);
      }
    }

    root.innerHTML = `
      <div class="offlineGame-over-overlay">
        <div class="offlineGame-over-box">
          <h1 class="offlineGame-over-title">${won ? i18n.t('player_1_wins') : i18n.t('player_2_wins')}</h1>
          <p class="offlineGame-over-score">${scoreP1} - ${scoreP2}</p>
          <div class="offlineGame-over-actions">
            <button class="offlineGame-btn" id="btn-rematch">REMATCH</button>
            <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-back">BACK</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-rematch")?.addEventListener("click", () => {
      startFriendMatch(root);
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      showModeSelection(root);
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

async function startMatch(root: HTMLElement) {
  // Load customization
  const customization = await boardCustomizationService.loadCustomization();
  root.innerHTML = `
    <div class="offlineGame-box">
      <div class="offlineGame-scoreboard">
        <div>
          <div class="offlineGame-score-label">${i18n.t('you')}</div>
          <div class="offlineGame-score-value" id="score-player">0</div>
        </div>
        <div class="offlineGame-score-divider">:</div>
        <div>
          <div class="offlineGame-score-label">${i18n.t('ai')}</div>
          <div class="offlineGame-score-value" id="score-ai">0</div>
        </div>
      </div>
      <div class="offlineGame-canvas-wrapper">
        <canvas id="game-canvas" width="${CONFIG.width}" height="${CONFIG.height}" class="offlineGame-canvas"></canvas>
        <div class="offlineGame-countdown" id="countdown">
          <span class="offlineGame-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-pause">PAUSE</button>
        <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-quit">QUIT</button>
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
    if (paused || !gameStarted) return;

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
    ballX = CONFIG.width / 2;
    ballY = CONFIG.height / 2;
    ballVX = (Math.random() * 2 - 1) * ballSpeed * 0.5;
    ballVY = dir * ballSpeed;
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
        // For offline games against AI, we can record it as a match against a bot
        // We'll use a special ID or flag for AI opponent
        // Since the backend expects an opponent ID, we might need to adjust the backend
        // or just not save offline games to the main match history if the backend doesn't support it.
        // However, the user asked to register stats.
        
        // Let's assume we want to track wins/losses locally or send to a specific endpoint if available.
        // Currently the stats service fetches from backend.
        // If we want to save this, we need an endpoint.
        // Since we don't have a specific "offline match" endpoint, we might skip saving to DB 
        // OR we can implement a client-side only storage or a new endpoint.
        
        // Given the prompt "see if they are registreeted in the stats or ot", 
        // and we just fixed the server for online games.
        // Offline games are client-side. To register them in stats (which come from server),
        // we would need to send this result to the server.
        
        // Let's check if we can use the existing match history endpoint.
        // The addMatchHistory in db.js takes (userId, opponentId, ...).
        // If opponentId is null, it might work if the DB allows it.
        // Let's try to send it to a new endpoint we'll create, or just log it for now if we can't change server.
        // But wait, I can change the server.
        
        // I will add a call to a new service method to save offline match.
        await statsService.saveOfflineMatch({
          playerScore: scorePlayer,
          aiScore: scoreAI,
          result: won ? 'win' : 'loss',
          difficulty: AI_DIFFICULTY_LABELS[Math.floor(selectedAIDifficulty / 50)] || 'CUSTOM'
        });
      } catch (err) {
        console.error("Failed to save offline match stats:", err);
      }
    }

    root.innerHTML = `
      <div class="offlineGame-over-overlay">
        <div class="offlineGame-over-box">
          <h1 class="offlineGame-over-title">${won ? i18n.t('you_win') : i18n.t('you_lose')}</h1>
          <p class="offlineGame-over-score">${scorePlayer} - ${scoreAI}</p>
          <div class="offlineGame-over-actions">
            <button class="offlineGame-btn" id="btn-rematch">REMATCH</button>
            <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-back">BACK</button>
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
