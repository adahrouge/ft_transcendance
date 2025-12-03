// src/views/AI.ts
// AI match view with:
// - Start Match gate
// - Countdown (3-2-1) that respects Pause (Space or Pause button)
// - AI "vision" throttled to 1 Hz (samples ball once per second)
// - AI simulates keyboard input (virtual ↑/↓), no direct rY writes

import { navigate } from '../router.js';
import { StrongPaddleAI } from '../utils/ai.js';
import { getCurrentUser } from '../utils/user.js';

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360;  // human & AI paddle speed (keys)
const BALL_SPEED = 340;
const SCORE_TO_WIN = 5;

export const AIGameView = () => {
  const wrap = document.createElement('div');
  const user = getCurrentUser();

  // Require authentication to play vs AI
  if (!user) {
    wrap.innerHTML = `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
        <h2>Play vs AI</h2>
        <p class="text-gray-400 text-sm">You must be logged in to play against the AI.</p>
        <div class="flex items-start gap-5 mt-4 flex-wrap">
          <a href="/profile" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70">Login / Register</a>
          <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" data-link href="/home">Back</a>
        </div>
      </div>
    `;
    return wrap;
  }

  // --- Pre-game UI: Start Match ---
  wrap.innerHTML = `
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <h2>Play vs AI</h2>
      <p class="text-gray-400 text-sm">You: W/S · AI: simulated ↑/↓ (no direct moves)</p>
      <div class="flex items-start gap-5 mt-4 flex-wrap justify-between items-baseline">
        <div><strong>You</strong> vs <strong>AI</strong></div>
        <div class="inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-gray-200 font-semibold text-sm tracking-wider uppercase border border-indigo-400/60" id="score">0 : 0</div>
      </div>
      <div class="flex items-start gap-5 mt-4 flex-wrap mt-2">
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="start">Start Match</button>
        <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" data-link href="/home">Back</a>
      </div>
    </div>
    <div id="host" class="relative"></div>
  `;

  (wrap.querySelector('#start') as HTMLButtonElement).onclick = () => startMatch();

  function startMatch() {
    const host = wrap.querySelector('#host') as HTMLDivElement;

    // In-game controls appear now, before countdown (so Pause can freeze countdown)
    host.innerHTML = `
      <div class="flex items-start gap-5 mt-4 flex-wrap mt-2 gap-3">
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" id="pause">Pause</button>
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" id="quit">Quit</button>
      </div>
    `;

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    // Countdown overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '96px',
      fontWeight: '700',
      color: '#fff',
      background: 'rgba(0,0,0,0.35)',
      userSelect: 'none'
    } as CSSStyleDeclaration);
    host.appendChild(overlay);

    // State
    let lY = HEIGHT / 2 - PADDLE_H / 2;            // human (left)
    let rY = HEIGHT / 2 - PADDLE_H / 2;            // AI (right)
    let ballX = WIDTH / 2, ballY = HEIGHT / 2;
    let ballVX = Math.random() < 0.5 ? BALL_SPEED : -BALL_SPEED;
    let ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;
    let keys = { w: false, s: false };             // human keys
    let aiKeys = { up: false, down: false };       // AI virtual keys
    let scoreL = 0, scoreR = 0;
    let paused = false;            // also freezes countdown
    let raf = 0;
    let gameStarted = false;       // true after countdown completes

    // --- AI "vision" throttle (1 Hz) ---
    const VISION_MS = 1000;
    let nextVisionTs = 0;
    let sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };
    function updateAIVision(nowMs: number) {
      if (nowMs >= nextVisionTs) {
        sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };
        nextVisionTs = nowMs + VISION_MS;
      }
    }

    // AI init
    const ai = new StrongPaddleAI({
      tableW: WIDTH,
      tableH: HEIGHT,
      paddleH: PADDLE_H,
      paddleX: WIDTH - (PADDLE_W + 10), // right paddle's left edge
      ballR: BALL_R,
      baseBallSpeed: BALL_SPEED,
      maxSpeed: 420,
      maxAccel: 2200,
      reactionMs: 180,
      aimJitter: 18,
      steadyJitter: 1.25,
      overshootBias: 0.15,
      minReactionMs: 120,
      maxReactionMs: 260,
      minJitter: 6,
      maxJitter: 22,
      focusCycleMs: 2600,
      defocusFrac: 0.25,
      defocusMultiplier: 1.35,
    });

    function drawTable() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      ctx.setLineDash([10, 15]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 10);
      ctx.lineTo(WIDTH / 2, HEIGHT - 10);
      ctx.stroke();
      ctx.restore();
    }
    function drawPaddle(x: number, y: number) {
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(x, y, PADDLE_W, PADDLE_H);
    }
    function drawBall(x: number, y: number) {
      ctx.beginPath();
      ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#f2f2ff';
      ctx.fill();
    }
    function updateScoreboard() {
      const el = wrap.querySelector('#score')!;
      el.textContent = `${scoreL} : ${scoreR}`;
    }

    // Input
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
      if (e.key === 'w' || e.key === 'W') keys.w = true;
      if (e.key === 's' || e.key === 'S') keys.s = true;
      if (e.key === ' ') paused = !paused; // pause also freezes countdown
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
      if (e.key === 'w' || e.key === 'W') keys.w = false;
      if (e.key === 's' || e.key === 'S') keys.s = false;
    };
    window.addEventListener('keydown', keyDown, { capture: true });
    window.addEventListener('keyup', keyUp, { capture: true });

    (wrap.querySelector('#pause') as HTMLButtonElement).onclick = () => { paused = !paused; };
    (wrap.querySelector('#quit') as HTMLButtonElement).onclick = () => {
      if (confirm('Quit this match?')) { teardown(); navigate('/home'); }
    };

    // Fixed timestep loop
    let last = 0;
    let acc = 0;
    const dt = 1000 / 60;

    function frame(now: number) {
      const elapsed = now - last;
      last = now;
      acc += elapsed;
      while (acc >= dt) {
        step(dt / 1000, now);
        acc -= dt;
      }
      render();
      if (isOver()) { endMatch(); return; }
      raf = requestAnimationFrame(frame);
    }

    function step(dtSec: number, nowMs: number) {
      if (paused || !gameStarted) return;

      // Refresh AI vision at most once per second
      updateAIVision(nowMs);

      // Human paddle (left)
      if (keys.w) lY -= PADDLE_SPEED * dtSec;
      if (keys.s) lY += PADDLE_SPEED * dtSec;
      lY = Math.max(0, Math.min(HEIGHT - PADDLE_H, lY));

      // --- AI planning (uses throttled sampledBall), then simulated keys ---
      // Call AI to update its internal plan/state; ignore its return position.
      ai.update(
        dtSec,
        nowMs,
        rY,
        sampledBall,  // <= throttled perception
        scoreL,
        scoreR
      );

      // Translate AI intent to key presses (virtual ↑/↓)
      const snap = ai.getSnapshot();
      const aiDesiredCenter = (snap.targetY ?? rY) + PADDLE_H / 2;
      const aiCenter = rY + PADDLE_H / 2;
      const deadband = 3; // avoid jitter
      aiKeys.up = aiCenter > aiDesiredCenter + deadband;
      aiKeys.down = aiCenter < aiDesiredCenter - deadband;

      // Move AI paddle via the SAME path as a human player
      if (aiKeys.up)   rY -= PADDLE_SPEED * dtSec;
      if (aiKeys.down) rY += PADDLE_SPEED * dtSec;
      rY = Math.max(0, Math.min(HEIGHT - PADDLE_H, rY));

      // Ball integration
      ballX += ballVX * dtSec;
      ballY += ballVY * dtSec;

      // Walls
      if (ballY - BALL_R <= 0 && ballVY < 0) { ballVY *= -1; ballY = BALL_R; }
      if (ballY + BALL_R >= HEIGHT && ballVY > 0) { ballVY *= -1; ballY = HEIGHT - BALL_R; }

      // Left paddle (human)
      if (ballX - BALL_R <= PADDLE_W + 10) {
        if (ballY >= lY && ballY <= lY + PADDLE_H && ballVX < 0) {
          ballVX *= -1;
          const rel = (ballY - (lY + PADDLE_H / 2)) / (PADDLE_H / 2);
          ballVY = rel * BALL_SPEED;
          ballX = PADDLE_W + 10 + BALL_R;
        } else if (ballX < 0) {
          scoreR++; serve(+1);
        }
      }

      // Right paddle (AI)
      if (ballX + BALL_R >= WIDTH - (PADDLE_W + 10)) {
        if (ballY >= rY && ballY <= rY + PADDLE_H && ballVX > 0) {
          ballVX *= -1;

          // AI return intent (blend lane plan with classic contact)
          const rel = (ballY - (rY + PADDLE_H / 2)) / (PADDLE_H / 2);
          const aiVy = ai.onContact(ballY);
          ballVY = 0.55 * (rel * BALL_SPEED) + 0.45 * aiVy;

          // Clamp total speed
          const speed = Math.hypot(ballVX, ballVY);
          const cap = BALL_SPEED * 1.2;
          if (speed > cap) {
            const s = cap / speed;
            ballVX *= s; ballVY *= s;
          }

          ballX = WIDTH - (PADDLE_W + 10) - BALL_R;
        } else if (ballX > WIDTH) {
          scoreL++; serve(-1);
        }
      }

      updateScoreboard();
    }

    function render() {
      drawTable();
      drawPaddle(10, lY);
      drawPaddle(WIDTH - PADDLE_W - 10, rY);
      drawBall(ballX, ballY);
    }

    function serve(dir: number) {
      ballX = WIDTH / 2; ballY = HEIGHT / 2;
      ballVX = dir * BALL_SPEED;
      ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;
    }

    function isOver() { return scoreL >= SCORE_TO_WIN || scoreR >= SCORE_TO_WIN; }

    function endMatch() {
      alert(`Match ended.\nYou: ${scoreL} — AI: ${scoreR}`);
      teardown();
      navigate('/home');
    }

    function teardown() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keyDown, { capture: true } as any);
      window.removeEventListener('keyup', keyUp, { capture: true } as any);
    }

    // ---- Countdown that respects Pause ----
    function startCountdown(seconds: number, onDone: () => void) {
      let remainingMs = seconds * 1000;
      let lastTs = 0;
      let running = true;

      function tick(ts: number) {
        if (!running) return;
        if (!lastTs) lastTs = ts;

        const dt = paused ? 0 : (ts - lastTs);
        lastTs = ts;
        remainingMs = Math.max(0, remainingMs - dt);

        const secsInt = Math.ceil(remainingMs / 1000);
        if (secsInt > 0) {
          overlay.textContent = String(secsInt);
          requestAnimationFrame(tick);
        } else {
          overlay.textContent = 'Go!';
          setTimeout(() => {
            overlay.remove();
            running = false;
            onDone();
          }, 300);
        }
      }
      requestAnimationFrame(tick);
    }

    // Kick off: render static table and freeze logic until countdown finishes
    updateScoreboard();
    drawTable();
    drawPaddle(10, lY);
    drawPaddle(WIDTH - PADDLE_W - 10, rY);
    drawBall(ballX, ballY);

    startCountdown(3, () => {
      gameStarted = true;
      const now = performance.now();
      let lastRef = now;
      last = lastRef;
      raf = requestAnimationFrame(frame);
    });
  }

  return wrap;
};
