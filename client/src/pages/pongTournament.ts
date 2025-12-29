import {
  PongAI,
  DEFAULT_GAME_CONFIG,
  clamp,
  BALL_SPEEDS,
  getAIConfigFromDifficulty,
  renderGame,
  setupTouchControls,
  startCountdown,
} from "../utils/pong.ts";
import { generateBots, createBracket } from "../utils/pongTournament.ts";
import type { TournamentParticipant, LocalTournament } from "../types/pongTournament";
import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import { boardCustomizationService } from "../services/boardCustomization";
import { statsService } from "../services/stats";
import "../styles/pong.css";
import "../styles/pongTournament.css";

const CONFIG = DEFAULT_GAME_CONFIG;
const BALL_SPEED = BALL_SPEEDS.normal;

let globalRaf: number | null = null;

// ============ Page Entry ============

export function renderTournamentPage(): string {
  setTimeout(() => {
    setupTournament();
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

function setupTournament() {
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

  showTournamentSetup(root);
}

// ============ LOCAL TOURNAMENT SYSTEM ============

let activeTournament: LocalTournament | null = null;
let tournamentWinSaved = false;

function showTournamentSetup(root: HTMLElement) {
  if (activeTournament && activeTournament.isActive) {
    showTournamentBracket(root);
    return;
  }

  root.innerHTML = `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('local_tournament')}</h1>
      <p class="pong-subtitle">${i18n.t('local_tournament_desc')}</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-4man">
          <span class="pong-mode-title">${i18n.t('tournament_4_players')}</span>
          <span class="pong-mode-desc">${i18n.t('tournament_4_desc')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-8man">
          <span class="pong-mode-title">${i18n.t('tournament_8_players')}</span>
          <span class="pong-mode-desc">${i18n.t('tournament_8_desc')}</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">${i18n.t('back')}</button>
      </div>
    </div>
  `;

  document.getElementById("btn-4man")?.addEventListener("click", () => startLocalTournament(root, 4));
  document.getElementById("btn-8man")?.addEventListener("click", () => startLocalTournament(root, 8));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

function startLocalTournament(root: HTMLElement, size: 4 | 8) {
  tournamentWinSaved = false;

  const player: TournamentParticipant = {
    name: i18n.t('you').toUpperCase(),
    isPlayer: true,
    difficulty: 0
  };

  const bots = generateBots(size - 1);
  const allParticipants = [player, ...bots].sort(() => Math.random() - 0.5);
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
    ? [i18n.t('semi_finals'), i18n.t('final')]
    : [i18n.t('quarter_finals'), i18n.t('semi_finals'), i18n.t('final')];

  let nextMatch: { round: number; match: number } | null = null;

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

  const playerInTournament = t.bracket.some(round =>
    round.some(match =>
      (match.p1?.isPlayer || match.p2?.isPlayer) &&
      (!match.winner || match.winner.isPlayer)
    )
  );

  const finalMatch = t.bracket[t.bracket.length - 1][0];
  const tournamentComplete = finalMatch.winner !== null;
  const playerEliminated = !playerInTournament && !tournamentComplete;

  const buildFifaBracket = () => {
    if (t.size === 4) {
      return `
        <div class="fifa-bracket fifa-bracket-4">
          <div class="fifa-round fifa-round-semis">
            <div class="fifa-round-title">${roundNames[0]}</div>
            ${buildMatchCard(0, 0, nextMatch)}
            ${buildMatchCard(0, 1, nextMatch)}
          </div>
          <div class="fifa-connectors">
            <div class="fifa-connector-line"></div>
          </div>
          <div class="fifa-round fifa-round-final">
            <div class="fifa-round-title">${roundNames[1]}</div>
            ${buildMatchCard(1, 0, nextMatch)}
            <div class="fifa-trophy"></div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="fifa-bracket fifa-bracket-8">
          <div class="fifa-round fifa-round-quarters">
            <div class="fifa-round-title">${roundNames[0]}</div>
            ${buildMatchCard(0, 0, nextMatch)}
            ${buildMatchCard(0, 1, nextMatch)}
            ${buildMatchCard(0, 2, nextMatch)}
            ${buildMatchCard(0, 3, nextMatch)}
          </div>
          <div class="fifa-connectors fifa-connectors-8">
            <div class="fifa-connector-group">
              <div class="fifa-connector-line"></div>
            </div>
            <div class="fifa-connector-group">
              <div class="fifa-connector-line"></div>
            </div>
          </div>
          <div class="fifa-round fifa-round-semis">
            <div class="fifa-round-title">${roundNames[1]}</div>
            ${buildMatchCard(1, 0, nextMatch)}
            ${buildMatchCard(1, 1, nextMatch)}
          </div>
          <div class="fifa-connectors">
            <div class="fifa-connector-line"></div>
          </div>
          <div class="fifa-round fifa-round-final">
            <div class="fifa-round-title">${roundNames[2]}</div>
            ${buildMatchCard(2, 0, nextMatch)}
            <div class="fifa-trophy"></div>
          </div>
        </div>
      `;
    }
  };

  const buildMatchCard = (roundIdx: number, matchIdx: number, next: { round: number; match: number } | null) => {
    const match = t.bracket[roundIdx]?.[matchIdx];
    if (!match) return '';

    const isNext = next && next.round === roundIdx && next.match === matchIdx;
    const isPlayerMatch = match.p1?.isPlayer || match.p2?.isPlayer;
    const isDone = match.winner !== null;

    return `
      <div class="fifa-match ${isNext ? 'fifa-match-next' : ''} ${isDone ? 'fifa-match-done' : ''}">
        <div class="fifa-match-players">
          <div class="fifa-player ${match.winner === match.p1 ? 'fifa-player-winner' : ''} ${match.p1?.isPlayer ? 'fifa-player-you' : ''}">
            <span class="fifa-player-name">${match.p1?.name || i18n.t('tbd_short')}</span>
            ${isDone ? `<span class="fifa-player-score">${match.p1Score}</span>` : ''}
          </div>
          <div class="fifa-player ${match.winner === match.p2 ? 'fifa-player-winner' : ''} ${match.p2?.isPlayer ? 'fifa-player-you' : ''}">
            <span class="fifa-player-name">${match.p2?.name || i18n.t('tbd_short')}</span>
            ${isDone ? `<span class="fifa-player-score">${match.p2Score}</span>` : ''}
          </div>
        </div>
        ${isNext && !tournamentComplete ? `
          <button class="fifa-play-btn" data-round="${roundIdx}" data-match="${matchIdx}">
            ${isPlayerMatch ? i18n.t('play') : i18n.t('simulate')}
          </button>
        ` : ''}
      </div>
    `;
  };

  root.innerHTML = `
    <div class="pong-start-box fifa-tournament-box">
      <h1 class="pong-title">${i18n.t('local_tournament')} - ${t.size} ${i18n.t('players')}</h1>

      ${tournamentComplete ? `
        <div class="fifa-winner-banner">
          <div class="fifa-winner-crown"></div>
          <div class="fifa-winner-name">${finalMatch.winner?.isPlayer ? i18n.t('congratulations') : finalMatch.winner?.name + ' ' + i18n.t('wins_tournament')}</div>
          ${finalMatch.winner?.isPlayer ? `<div class="fifa-winner-subtitle">${i18n.t('you_are_champion')}</div>` : ''}
        </div>
      ` : playerEliminated ? `
        <div class="fifa-eliminated-banner">
          <div class="fifa-eliminated-icon"></div>
          <div class="fifa-eliminated-text">${i18n.t('you_were_eliminated')}</div>
          <div class="fifa-eliminated-hint">${i18n.t('watch_remaining')}</div>
        </div>
      ` : ''}

      ${buildFifaBracket()}

      <div class="pong-controls" style="margin-top: 24px;">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-quit-tournament">
          ${tournamentComplete ? i18n.t('back_to_menu') : i18n.t('quit_tournament')}
        </button>
      </div>
    </div>
  `;

  root.querySelectorAll('.fifa-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = parseInt((btn as HTMLElement).dataset.round || '0');
      const m = parseInt((btn as HTMLElement).dataset.match || '0');
      const match = t.bracket[r][m];

      if (match.p1?.isPlayer || match.p2?.isPlayer) {
        playTournamentMatch(root, r, m);
      } else {
        simulateBotMatch(root, r, m);
      }
    });
  });

  if (tournamentComplete && finalMatch.winner?.isPlayer && !tournamentWinSaved) {
    tournamentWinSaved = true;
    statsService.saveTournamentWin({
      size: t.size,
      rounds: t.bracket.length
    }).then(() => {
      import("../utils/notifications").then(({ showNotification }) => {
        showNotification(i18n.t('tournament_victory_saved'), { type: 'success' });
      });
    }).catch(() => {
      tournamentWinSaved = false;
    });
  }

  document.getElementById("btn-quit-tournament")?.addEventListener("click", () => {
    activeTournament = null;
    tournamentWinSaved = false;
    navigateTo("/home");
  });
}

function simulateBotMatch(root: HTMLElement, roundIndex: number, matchIndex: number) {
  if (!activeTournament) return;

  const match = activeTournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;

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

  advanceWinner(roundIndex, matchIndex);
  showTournamentBracket(root);
}

function advanceWinner(roundIndex: number, matchIndex: number) {
  if (!activeTournament) return;

  const winner = activeTournament.bracket[roundIndex][matchIndex].winner;
  if (!winner) return;

  if (roundIndex + 1 < activeTournament.bracket.length) {
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = activeTournament.bracket[roundIndex + 1][nextMatchIndex];

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

  const playerIsP1 = match.p1.isPlayer;
  const aiParticipant = playerIsP1 ? match.p2 : match.p1;

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
      <!-- Touch controls for mobile -->
      <div class="pong-touch-controls pong-touch-controls-single" id="tournament-touch-controls">
        <div class="pong-touch-section pong-touch-single">
          <span class="pong-touch-label">${i18n.t('you')}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="tournament-player-left">◄</button>
            <button class="pong-touch-btn" id="tournament-player-right">►</button>
          </div>
        </div>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary" id="btn-pause">${i18n.t('pause')}</button>
        <button class="pong-btn pong-btn-secondary" id="btn-withdraw">${i18n.t('quit')}</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEED;
  const aiConfig = getAIConfigFromDifficulty(aiDifficulty);

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

  setupTouchControls(document.getElementById("tournament-player-left"), document.getElementById("tournament-player-right"), keys);

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-withdraw")?.addEventListener("click", () => {
    withdrawFromMatch();
  });

  function withdrawFromMatch() {
    teardown();

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
        ballVX = rel * ballSpeed;
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

  function endTournamentMatch() {
    teardown();

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

    root.innerHTML = `
      <div class="pong-over-overlay">
        <div class="pong-over-box">
          <h1 class="pong-over-title">${playerWon ? i18n.t('you_win') : i18n.t('you_lose')}</h1>
          <p class="pong-over-score">${scorePlayer} - ${scoreAI}</p>
          <div class="pong-over-actions">
            <button class="pong-btn" id="btn-continue">${i18n.t('continue')}</button>
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

  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    last = performance.now();
    globalRaf = requestAnimationFrame(frame);
  });
}
