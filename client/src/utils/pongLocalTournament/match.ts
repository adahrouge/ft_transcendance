import { navigateTo } from "../../router";
import { boardCustomizationService } from "../../services/boardCustomization";
import {
  clamp,
  BALL_SPEEDS,
  renderGame,
  setupTouchControls,
  startCountdown,
  DEFAULT_GAME_CONFIG,
} from "../pong";
import { createLocalMatchCanvas, createLocalMatchResult } from "../../components/pongLocalTournament";
import { localTournamentState, getActiveLocalTournament, resetLocalTournament } from "./state";
import { advanceLocalWinner, isTournamentComplete } from "./bracketLogic";
import type { LocalTournamentPlayer } from "../../types/pongLocalTournament";

const CONFIG = DEFAULT_GAME_CONFIG;
const BALL_SPEED = BALL_SPEEDS.normal;

// Callback to return to bracket view (set by setup.ts to avoid circular dependency)
let onMatchEndCallback: ((root: HTMLElement) => void) | null = null;

export function setMatchEndCallback(callback: (root: HTMLElement) => void) {
  onMatchEndCallback = callback;
}

export async function startLocalTournamentMatch(
  root: HTMLElement,
  roundIndex: number,
  matchIndex: number,
  onMatchEnd?: (root: HTMLElement) => void
) {
  const tournament = getActiveLocalTournament();
  if (!tournament) return;

  const match = tournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;

  const p1 = match.p1;
  const p2 = match.p2;

  const customization = await boardCustomizationService.loadCustomization();
  
  root.innerHTML = createLocalMatchCanvas(CONFIG, p1, p2);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const countdownEl = document.getElementById("countdown") as HTMLDivElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;

  const ballSpeed = BALL_SPEED;

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
    // P1 controls: A/D (bottom paddle)
    if (e.key === "a" || e.key === "A") p1Keys.left = true;
    if (e.key === "d" || e.key === "D") p1Keys.right = true;
    // P2 controls: Arrow keys (top paddle)
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

  // Touch controls
  setupTouchControls(document.getElementById("local-p1-left"), document.getElementById("local-p1-right"), p1Keys);
  setupTouchControls(document.getElementById("local-p2-left"), document.getElementById("local-p2-right"), p2Keys);

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    paused = !paused;
  });

  document.getElementById("btn-quit-match")?.addEventListener("click", () => {
    quitTournament();
  });

  function quitTournament() {
    teardown();
    resetLocalTournament();
    navigateTo("/pong");
  }

  let last = 0;
  let acc = 0;
  const dt = 1000 / 60;

  if (localTournamentState.globalRaf !== null) {
    cancelAnimationFrame(localTournamentState.globalRaf);
    localTournamentState.globalRaf = null;
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

    localTournamentState.globalRaf = requestAnimationFrame(frame);
  }

  function step(dtSec: number) {
    if (paused || !gameStarted || servePaused) return;

    // P1 movement (bottom paddle)
    if (p1Keys.left) p1X -= CONFIG.paddleSpeed * dtSec;
    if (p1Keys.right) p1X += CONFIG.paddleSpeed * dtSec;
    p1X = clamp(p1X, 0, CONFIG.width - CONFIG.paddleW);

    // P2 movement (top paddle)
    if (p2Keys.left) p2X -= CONFIG.paddleSpeed * dtSec;
    if (p2Keys.right) p2X += CONFIG.paddleSpeed * dtSec;
    p2X = clamp(p2X, 0, CONFIG.width - CONFIG.paddleW);

    // Ball physics
    ballX += ballVX * dtSec;
    ballY += ballVY * dtSec;

    const halfBall = CONFIG.ballSize / 2;

    // Wall collisions
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

    // P2 scores (ball goes past top)
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

    // P1 scores (ball goes past bottom)
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

  function endMatch() {
    teardown();
    
    const currentTournament = getActiveLocalTournament();
    if (!currentTournament) return;
    
    const winner = scoreP1 >= CONFIG.scoreToWin ? p1 : p2;
    
    // Update tournament state
    match.p1Score = scoreP1;
    match.p2Score = scoreP2;
    match.winner = winner;
    
    // Advance winner to next round
    advanceLocalWinner(currentTournament.bracket, roundIndex, matchIndex);
    
    const isFinal = isTournamentComplete(currentTournament.bracket);
    
    root.innerHTML = createLocalMatchResult(winner, scoreP1, scoreP2, isFinal);

    document.getElementById("btn-continue")?.addEventListener("click", () => {
      if (onMatchEnd) {
        onMatchEnd(root);
      }
    });
  }

  function teardown() {
    if (localTournamentState.globalRaf !== null) {
      cancelAnimationFrame(localTournamentState.globalRaf);
      localTournamentState.globalRaf = null;
    }
    window.removeEventListener("keydown", keyDown, { capture: true } as EventListenerOptions);
    window.removeEventListener("keyup", keyUp, { capture: true } as EventListenerOptions);
  }

  updateScoreboard();
  render();

  startCountdown(countdownEl, countdownText, 3, () => paused, () => {
    gameStarted = true;
    last = performance.now();
    localTournamentState.globalRaf = requestAnimationFrame(frame);
  });
}
