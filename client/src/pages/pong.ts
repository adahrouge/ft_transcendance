import { PongAI, DEFAULT_GAME_CONFIG, clamp } from "../utils/pong.ts";
import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import { boardCustomizationService } from "../services/boardCustomization";
import type { BoardCustomization } from "../types/boardCustomization";
import { statsService } from "../services/stats";
import "../styles/pong.css";
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
    <div class="pong-container" style="background-image: url('${backgroundImage}')">
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

  // Show mode selection screen
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
        <button class="pong-mode-btn pong-mode-btn-tournament" id="btn-tournament">
          <span class="pong-mode-title">🏆 TOURNAMENT</span>
          <span class="pong-mode-desc">Local bracket vs AI bots</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
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

  document.getElementById("btn-tournament")?.addEventListener("click", () => {
    showTournamentSetup(root);
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

// ============ LOCAL TOURNAMENT SYSTEM ============

interface TournamentParticipant {
  name: string;
  isPlayer: boolean;
  difficulty: number; // AI difficulty 0-100
}

interface TournamentMatchup {
  p1: TournamentParticipant | null;
  p2: TournamentParticipant | null;
  winner: TournamentParticipant | null;
  p1Score: number;
  p2Score: number;
}

interface LocalTournament {
  size: 4 | 8;
  participants: TournamentParticipant[];
  bracket: TournamentMatchup[][];
  currentRound: number;
  currentMatch: number;
  isActive: boolean;
}

let activeTournament: LocalTournament | null = null;

const BOT_NAMES = [
  "RoboPong", "ByteBot", "PixelAce", "NeonKnight", 
  "CyberPaddle", "GlitchMaster", "LaserLord", "TurboTron"
];

function generateBots(count: number): TournamentParticipant[] {
  const bots: TournamentParticipant[] = [];
  const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    bots.push({
      name: shuffledNames[i % shuffledNames.length],
      isPlayer: false,
      difficulty: 30 + Math.random() * 50 // Random difficulty between 30-80
    });
  }
  return bots;
}

function createBracket(participants: TournamentParticipant[]): TournamentMatchup[][] {
  const bracket: TournamentMatchup[][] = [];
  const numRounds = Math.log2(participants.length);
  
  // First round - pair up participants
  const firstRound: TournamentMatchup[] = [];
  for (let i = 0; i < participants.length; i += 2) {
    firstRound.push({
      p1: participants[i],
      p2: participants[i + 1],
      winner: null,
      p1Score: 0,
      p2Score: 0
    });
  }
  bracket.push(firstRound);
  
  // Create empty slots for subsequent rounds
  let matchCount = firstRound.length / 2;
  for (let r = 1; r < numRounds; r++) {
    const round: TournamentMatchup[] = [];
    for (let m = 0; m < matchCount; m++) {
      round.push({
        p1: null,
        p2: null,
        winner: null,
        p1Score: 0,
        p2Score: 0
      });
    }
    bracket.push(round);
    matchCount /= 2;
  }
  
  return bracket;
}

function showTournamentSetup(root: HTMLElement) {
  // Check if tournament is already in progress
  if (activeTournament && activeTournament.isActive) {
    showTournamentBracket(root);
    return;
  }
  
  root.innerHTML = `
    <div class="pong-start-box">
      <h1 class="pong-title">🏆 TOURNAMENT</h1>
      <p class="pong-subtitle">Local bracket tournament vs AI bots</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-4man">
          <span class="pong-mode-title">4 PLAYERS</span>
          <span class="pong-mode-desc">You + 3 AI bots (2 rounds)</span>
        </button>
        <button class="pong-mode-btn" id="btn-8man">
          <span class="pong-mode-title">8 PLAYERS</span>
          <span class="pong-mode-desc">You + 7 AI bots (3 rounds)</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-4man")?.addEventListener("click", () => startLocalTournament(root, 4));
  document.getElementById("btn-8man")?.addEventListener("click", () => startLocalTournament(root, 8));
  document.getElementById("btn-back")?.addEventListener("click", () => showModeSelection(root));
}

function startLocalTournament(root: HTMLElement, size: 4 | 8) {
  // Create player
  const player: TournamentParticipant = {
    name: "YOU",
    isPlayer: true,
    difficulty: 0
  };
  
  // Generate AI bots
  const bots = generateBots(size - 1);
  
  // Shuffle all participants (player gets random position)
  const allParticipants = [player, ...bots].sort(() => Math.random() - 0.5);
  
  // Create bracket
  const bracket = createBracket(allParticipants);
  
  activeTournament = {
    size,
    participants: allParticipants,
    bracket,
    currentRound: 0,
    currentMatch: 0,
    isActive: true
  };
  
  showTournamentBracket(root);
}

function showTournamentBracket(root: HTMLElement) {
  if (!activeTournament) {
    showTournamentSetup(root);
    return;
  }
  
  const t = activeTournament;
  const roundNames = t.size === 4 
    ? ["SEMI-FINALS", "FINAL"]
    : ["QUARTER-FINALS", "SEMI-FINALS", "FINAL"];
  
  // Find next match to play (player's match or bot vs bot to simulate)
  let nextMatch: { round: number; match: number } | null = null;
  let playerEliminated = false;
  
  for (let r = 0; r < t.bracket.length; r++) {
    for (let m = 0; m < t.bracket[r].length; m++) {
      const match = t.bracket[r][m];
      if (match.p1 && match.p2 && !match.winner) {
        nextMatch = { round: r, match: m };
        break;
      }
    }
    if (nextMatch) break;
  }
  
  // Check if player was eliminated
  const playerInTournament = t.bracket.some(round => 
    round.some(match => 
      (match.p1?.isPlayer || match.p2?.isPlayer) && 
      (!match.winner || match.winner.isPlayer)
    )
  );
  
  // Check if tournament is complete
  const finalMatch = t.bracket[t.bracket.length - 1][0];
  const tournamentComplete = finalMatch.winner !== null;
  
  if (!playerInTournament && !tournamentComplete) {
    playerEliminated = true;
  }
  
  root.innerHTML = `
    <div class="pong-start-box" style="max-width: 700px;">
      <h1 class="pong-title">🏆 TOURNAMENT - ${t.size} PLAYERS</h1>
      
      ${tournamentComplete ? `
        <div class="pong-tournament-winner">
          <div class="pong-winner-crown">👑</div>
          <div class="pong-winner-text">${finalMatch.winner?.isPlayer ? 'CONGRATULATIONS!' : finalMatch.winner?.name + ' WINS'}</div>
          ${finalMatch.winner?.isPlayer ? '<div class="pong-winner-subtitle">YOU ARE THE CHAMPION!</div>' : ''}
        </div>
      ` : playerEliminated ? `
        <div class="pong-eliminated">
          <div class="pong-eliminated-text">YOU WERE ELIMINATED</div>
          <div class="pong-eliminated-subtitle">Watch the remaining matches or quit</div>
        </div>
      ` : ''}
      
      <div class="pong-bracket">
        ${t.bracket.map((round, r) => `
          <div class="pong-bracket-round">
            <div class="pong-bracket-round-title">${roundNames[r]}</div>
            ${round.map((match, m) => {
              const isNext = nextMatch && nextMatch.round === r && nextMatch.match === m;
              const isPlayerMatch = match.p1?.isPlayer || match.p2?.isPlayer;
              return `
                <div class="pong-bracket-match ${isNext ? 'pong-bracket-match-next' : ''} ${match.winner ? 'pong-bracket-match-done' : ''}">
                  <div class="pong-bracket-player ${match.winner === match.p1 ? 'pong-bracket-winner' : ''} ${match.p1?.isPlayer ? 'pong-bracket-you' : ''}">
                    ${match.p1?.name || 'TBD'} ${match.winner ? `(${match.p1Score})` : ''}
                  </div>
                  <div class="pong-bracket-vs">vs</div>
                  <div class="pong-bracket-player ${match.winner === match.p2 ? 'pong-bracket-winner' : ''} ${match.p2?.isPlayer ? 'pong-bracket-you' : ''}">
                    ${match.p2?.name || 'TBD'} ${match.winner ? `(${match.p2Score})` : ''}
                  </div>
                  ${isNext && !tournamentComplete ? `
                    <button class="pong-bracket-play-btn" data-round="${r}" data-match="${m}">
                      ${isPlayerMatch ? 'PLAY' : 'SIMULATE'}
                    </button>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>

      <div class="pong-controls">
        ${tournamentComplete && finalMatch.winner?.isPlayer ? `
          <button class="pong-btn pong-btn-fullwidth" id="btn-save-win">SAVE VICTORY</button>
        ` : ''}
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-quit-tournament">
          ${tournamentComplete ? 'BACK TO MENU' : 'QUIT TOURNAMENT'}
        </button>
      </div>
    </div>
  `;

  // Play button handlers
  root.querySelectorAll('.pong-bracket-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = parseInt((btn as HTMLElement).dataset.round || '0');
      const m = parseInt((btn as HTMLElement).dataset.match || '0');
      const match = t.bracket[r][m];
      
      if (match.p1?.isPlayer || match.p2?.isPlayer) {
        // Player match - play the game
        playTournamentMatch(root, r, m);
      } else {
        // Bot vs bot - simulate
        simulateBotMatch(root, r, m);
      }
    });
  });

  document.getElementById("btn-save-win")?.addEventListener("click", async () => {
    try {
      await statsService.saveTournamentWin({
        size: t.size,
        rounds: t.bracket.length
      });
      import("../utils/notifications").then(({ showNotification }) => {
        showNotification("Tournament victory saved! 🏆", { type: 'success' });
      });
    } catch (e) {
      console.error("Failed to save tournament win:", e);
    }
  });

  document.getElementById("btn-quit-tournament")?.addEventListener("click", () => {
    activeTournament = null;
    showModeSelection(root);
  });
}

function simulateBotMatch(root: HTMLElement, roundIndex: number, matchIndex: number) {
  if (!activeTournament) return;
  
  const match = activeTournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;
  
  // Simulate scores based on difficulty difference
  const difficultyDiff = (match.p1.difficulty - match.p2.difficulty) / 100;
  const p1Advantage = 0.5 + difficultyDiff * 0.3;
  
  let p1Score = 0;
  let p2Score = 0;
  
  while (p1Score < CONFIG.scoreToWin && p2Score < CONFIG.scoreToWin) {
    if (Math.random() < p1Advantage) {
      p1Score++;
    } else {
      p2Score++;
    }
  }
  
  match.p1Score = p1Score;
  match.p2Score = p2Score;
  match.winner = p1Score > p2Score ? match.p1 : match.p2;
  
  // Advance winner to next round
  advanceWinner(roundIndex, matchIndex);
  
  // Refresh bracket view
  showTournamentBracket(root);
}

function advanceWinner(roundIndex: number, matchIndex: number) {
  if (!activeTournament) return;
  
  const winner = activeTournament.bracket[roundIndex][matchIndex].winner;
  if (!winner) return;
  
  // Check if there's a next round
  if (roundIndex + 1 < activeTournament.bracket.length) {
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = activeTournament.bracket[roundIndex + 1][nextMatchIndex];
    
    // Put winner in correct slot
    if (matchIndex % 2 === 0) {
      nextMatch.p1 = winner;
    } else {
      nextMatch.p2 = winner;
    }
  }
}

async function playTournamentMatch(root: HTMLElement, roundIndex: number, matchIndex: number) {
  if (!activeTournament) return;
  
  const match = activeTournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;
  
  // Determine which is player and which is AI
  const playerIsP1 = match.p1.isPlayer;
  const aiParticipant = playerIsP1 ? match.p2 : match.p1;
  
  // Start tournament match
  await startTournamentMatch(root, roundIndex, matchIndex, aiParticipant.difficulty, aiParticipant.name);
}

async function startTournamentMatch(
  root: HTMLElement, 
  roundIndex: number, 
  matchIndex: number,
  aiDifficulty: number,
  aiName: string
) {
  const customization = await boardCustomizationService.loadCustomization();
  
  root.innerHTML = `
    <div class="pong-box">
      <div class="pong-tournament-header">
        <span class="pong-tournament-round">TOURNAMENT MATCH</span>
      </div>
      <div class="pong-scoreboard">
        <div>
          <div class="pong-score-label">YOU</div>
          <div class="pong-score-value" id="score-player">0</div>
        </div>
        <div class="pong-score-divider">:</div>
        <div>
          <div class="pong-score-label">${aiName}</div>
          <div class="pong-score-value" id="score-ai">0</div>
        </div>
      </div>
      <div class="pong-canvas-wrapper">
        <canvas id="game-canvas" width="${CONFIG.width}" height="${CONFIG.height}" class="pong-canvas"></canvas>
        <div class="pong-countdown" id="countdown">
          <span class="pong-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary" id="btn-pause">PAUSE</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEEDS["normal"];
  const aiConfig = getAIConfigFromDifficulty(aiDifficulty);

  // Game state
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

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  const dt = 1000 / 60;
  let acc = 0;
  let last = performance.now();

  function stopRaf() {
    if (globalRaf !== null) {
      cancelAnimationFrame(globalRaf);
      globalRaf = null;
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

    // Player movement
    if (keys.left) playerX -= CONFIG.paddleSpeed * dtSec;
    if (keys.right) playerX += CONFIG.paddleSpeed * dtSec;
    playerX = clamp(playerX, 0, CONFIG.width - CONFIG.paddleW);

    // AI movement
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

    // Ball movement
    ballX += ballVX * dtSec;
    ballY += ballVY * dtSec;

    const halfBall = CONFIG.ballSize / 2;

    // Wall collisions
    if (ballX - halfBall < 0) {
      ballX = halfBall;
      ballVX *= -1;
    }
    if (ballX + halfBall > CONFIG.width) {
      ballX = CONFIG.width - halfBall;
      ballVX *= -1;
    }

    // AI paddle collision
    const aiPaddleY = 10;
    if (ballY - halfBall <= aiPaddleY + CONFIG.paddleH && ballVY < 0) {
      if (ballX >= aiX && ballX <= aiX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (aiX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = aiPaddleY + CONFIG.paddleH + halfBall;
      }
    }

    // Player scores
    if (ballY + halfBall < 0) {
      scorePlayer++;
      serve(1);
    }

    // Player paddle collision
    const playerPaddleY = CONFIG.height - CONFIG.paddleH - 10;
    if (ballY + halfBall >= playerPaddleY && ballVY > 0) {
      if (ballX >= playerX && ballX <= playerX + CONFIG.paddleW) {
        ballVY *= -1;
        const rel = (ballX - (playerX + CONFIG.paddleW / 2)) / (CONFIG.paddleW / 2);
        ballVX = rel * ballSpeed;
        ballY = playerPaddleY - halfBall;
      }
    }

    // AI scores
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

  function endTournamentMatch() {
    teardown();
    
    if (!activeTournament) return;
    
    const match = activeTournament.bracket[roundIndex][matchIndex];
    const playerWon = scorePlayer >= CONFIG.scoreToWin;
    
    // Determine scores based on player position
    if (match.p1?.isPlayer) {
      match.p1Score = scorePlayer;
      match.p2Score = scoreAI;
      match.winner = playerWon ? match.p1 : match.p2;
    } else {
      match.p1Score = scoreAI;
      match.p2Score = scorePlayer;
      match.winner = playerWon ? match.p2 : match.p1;
    }
    
    // Advance winner
    advanceWinner(roundIndex, matchIndex);
    
    // Show result briefly then return to bracket
    root.innerHTML = `
      <div class="pong-over-overlay">
        <div class="pong-over-box">
          <h1 class="pong-over-title">${playerWon ? 'YOU WIN!' : 'YOU LOSE!'}</h1>
          <p class="pong-over-score">${scorePlayer} - ${scoreAI}</p>
          <div class="pong-over-actions">
            <button class="pong-btn" id="btn-continue">CONTINUE</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById("btn-continue")?.addEventListener("click", () => {
      showTournamentBracket(root);
    });
  }

  function teardown() {
    stopRaf();
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

// ============ END TOURNAMENT SYSTEM ============

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
      <!-- Touch controls for mobile -->
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
  let servePaused = false; // Pause after scoring

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

  // Touch controls for mobile
  const p1LeftBtn = document.getElementById("friend-p1-left");
  const p1RightBtn = document.getElementById("friend-p1-right");
  const p2LeftBtn = document.getElementById("friend-p2-left");
  const p2RightBtn = document.getElementById("friend-p2-right");

  if (p1LeftBtn) {
    p1LeftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); p1Keys.left = true; });
    p1LeftBtn.addEventListener("touchend", (e) => { e.preventDefault(); p1Keys.left = false; });
    p1LeftBtn.addEventListener("mousedown", () => p1Keys.left = true);
    p1LeftBtn.addEventListener("mouseup", () => p1Keys.left = false);
  }
  if (p1RightBtn) {
    p1RightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); p1Keys.right = true; });
    p1RightBtn.addEventListener("touchend", (e) => { e.preventDefault(); p1Keys.right = false; });
    p1RightBtn.addEventListener("mousedown", () => p1Keys.right = true);
    p1RightBtn.addEventListener("mouseup", () => p1Keys.right = false);
  }
  if (p2LeftBtn) {
    p2LeftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); p2Keys.left = true; });
    p2LeftBtn.addEventListener("touchend", (e) => { e.preventDefault(); p2Keys.left = false; });
    p2LeftBtn.addEventListener("mousedown", () => p2Keys.left = true);
    p2LeftBtn.addEventListener("mouseup", () => p2Keys.left = false);
  }
  if (p2RightBtn) {
    p2RightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); p2Keys.right = true; });
    p2RightBtn.addEventListener("touchend", (e) => { e.preventDefault(); p2Keys.right = false; });
    p2RightBtn.addEventListener("mousedown", () => p2Keys.right = true);
    p2RightBtn.addEventListener("mouseup", () => p2Keys.right = false);
  }

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
    if (paused || !gameStarted || servePaused) return;

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
  const playerLeftBtn = document.getElementById("ai-player-left");
  const playerRightBtn = document.getElementById("ai-player-right");

  if (playerLeftBtn) {
    playerLeftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); keys.left = true; });
    playerLeftBtn.addEventListener("touchend", (e) => { e.preventDefault(); keys.left = false; });
    playerLeftBtn.addEventListener("mousedown", () => keys.left = true);
    playerLeftBtn.addEventListener("mouseup", () => keys.left = false);
  }
  if (playerRightBtn) {
    playerRightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); keys.right = true; });
    playerRightBtn.addEventListener("touchend", (e) => { e.preventDefault(); keys.right = false; });
    playerRightBtn.addEventListener("mousedown", () => keys.right = true);
    playerRightBtn.addEventListener("mouseup", () => keys.right = false);
  }

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
