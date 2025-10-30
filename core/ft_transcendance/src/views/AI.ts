// src/views/ai.ts
// Ready-to-play AI (no training). Predicts impact Y with bounce mirroring,
// simulates ArrowUp/ArrowDown at 1 Hz, respects identical paddle speed.

import { navigate } from '../router.js';
import { escapeHTML } from '../utils.js';

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360; // must match human speed
const BALL_SPEED = 340;
const SCORE_TO_WIN = 5;

export const AIGameView = () => {
  const wrap = document.createElement('div');

  const p1Alias = 'You';
  const p2Alias = 'AI';

  // Lobby card with Start button
  wrap.innerHTML = `
    <div class="card">
      <h2>Play vs AI</h2>
      <p class="muted">Left paddle: W/S · Right paddle: AI · Space = Pause</p>
      <div class="row" style="margin-top:8px;">
        <button class="btn primary" id="start">Start Match</button>
        <a class="btn" data-link href="/">Back</a>
      </div>
    </div>
    <div id="host" style="position:relative;"></div>
  `;

  (wrap.querySelector('#start') as HTMLButtonElement).onclick = () => startMatch();

  function startMatch() {
    const host = wrap.querySelector('#host') as HTMLDivElement;
    host.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content: space-between; align-items: baseline;">
          <div><strong>${escapeHTML(p1Alias)}</strong> vs <strong>${escapeHTML(p2Alias)}</strong></div>
          <div class="score" id="score">0 : 0</div>
        </div>
        <div class="row" style="margin-top:8px;">
          <button class="btn" id="pause">Pause</button>
          <button class="btn" id="quit">Quit</button>
        </div>
      </div>
    `;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    // --- Game state ---
    let lY = HEIGHT / 2 - PADDLE_H / 2; // human (W/S)
    let rY = HEIGHT / 2 - PADDLE_H / 2; // AI (ArrowUp/ArrowDown via synthetic events)

    let ballX = WIDTH / 2, ballY = HEIGHT / 2;
    let ballVX = Math.random() < 0.5 ? BALL_SPEED : -BALL_SPEED;
    let ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;

    const keys = { w: false, s: false, up: false, down: false };
    let scoreL = 0, scoreR = 0;
    let paused = false;
    let gameStarted = false;
    let raf = 0;

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

    function startCountdown(seconds = 3, done: () => void) {
      let t = seconds;
      overlay.textContent = String(t);
      const iv = setInterval(() => {
        t -= 1;
        if (t > 0) overlay.textContent = String(t);
        else {
          overlay.textContent = 'Go!';
          setTimeout(() => { overlay.remove(); clearInterval(iv); done(); }, 400);
        }
      }, 1000);
    }

    // --- Drawing ---
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

    // --- Input: Human = W/S only; AI uses synthetic Arrow events only ---
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();

      if (e.key === 'w' || e.key === 'W') keys.w = true;
      if (e.key === 's' || e.key === 'S') keys.s = true;

      // Only accept Arrow keys if event is NOT trusted (i.e., dispatched by our AI)
      if (!e.isTrusted) {
        if (e.key === 'ArrowUp') keys.up = true;
        if (e.key === 'ArrowDown') keys.down = true;
      }

      if (e.key === ' ') paused = !paused;
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();

      if (e.key === 'w' || e.key === 'W') keys.w = false;
      if (e.key === 's' || e.key === 'S') keys.s = false;

      if (!e.isTrusted) {
        if (e.key === 'ArrowUp') keys.up = false;
        if (e.key === 'ArrowDown') keys.down = false;
      }
    };

    (wrap.querySelector('#pause') as HTMLButtonElement).onclick = () => { paused = !paused; };
    (wrap.querySelector('#quit') as HTMLButtonElement).onclick = () => {
      if (confirm('Quit this match?')) { teardown(); navigate('/'); }
    };

    // --- Physics loop (fixed timestep) ---
    let last = performance.now();
    let acc = 0;
    const dt = 1000 / 60;

    function frame(now: number) {
      const elapsed = now - last;
      last = now;
      acc += elapsed;
      while (acc >= dt) {
        step(dt / 1000);
        acc -= dt;
      }
      render();
      if (isOver()) { endMatch(); return; }
      raf = requestAnimationFrame(frame);
    }

    function step(dtSec: number) {
      if (paused || !gameStarted) return;

      // Human (W/S)
      if (keys.w) lY -= PADDLE_SPEED * dtSec;
      if (keys.s) lY += PADDLE_SPEED * dtSec;

      // AI (ArrowUp/ArrowDown) – set by synthetic events
      if (keys.up) rY -= PADDLE_SPEED * dtSec;
      if (keys.down) rY += PADDLE_SPEED * dtSec;

      // Clamp paddles
      lY = Math.max(0, Math.min(HEIGHT - PADDLE_H, lY));
      rY = Math.max(0, Math.min(HEIGHT - PADDLE_H, rY));

      // Ball integration
      ballX += ballVX * dtSec;
      ballY += ballVY * dtSec;

      // Top/bottom walls
      if (ballY - BALL_R <= 0 && ballVY < 0) { ballVY *= -1; ballY = BALL_R; }
      if (ballY + BALL_R >= HEIGHT && ballVY > 0) { ballVY *= -1; ballY = HEIGHT - BALL_R; }

      // Left paddle collision / score
      if (ballX - BALL_R <= PADDLE_W + 10) {
        if (ballY >= lY && ballY <= lY + PADDLE_H && ballVX < 0) {
          ballVX *= -1;
          const rel = (ballY - (lY + PADDLE_H / 2)) / (PADDLE_H / 2);
          ballVY = rel * BALL_SPEED;
          ballX = PADDLE_W + 10 + BALL_R;
        } else if (ballX < 0) { scoreR++; serve(+1); }
      }

      // Right paddle collision / score
      if (ballX + BALL_R >= WIDTH - (PADDLE_W + 10)) {
        if (ballY >= rY && ballY <= rY + PADDLE_H && ballVX > 0) {
          ballVX *= -1;
          const rel = (ballY - (rY + PADDLE_H / 2)) / (PADDLE_H / 2);
          ballVY = rel * BALL_SPEED;
          ballX = WIDTH - (PADDLE_W + 10) - BALL_R;
        } else if (ballX > WIDTH) { scoreL++; serve(-1); }
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

      // Reset AI intent on every serve
      releaseBoth();
      lastPress = 'none';
    }

    function isOver() { return scoreL >= SCORE_TO_WIN || scoreR >= SCORE_TO_WIN; }

    function endMatch() {
      alert(`Match ended.\n${p1Alias}: ${scoreL} — ${p2Alias}: ${scoreR}`);
      teardown();
      navigate('/');
    }

    function teardown() {
      cancelAnimationFrame(raf);
      clearInterval(aiTimer);
      window.removeEventListener('keydown', keyDown, { capture: true } as any);
      window.removeEventListener('keyup', keyUp, { capture: true } as any);
      releaseBoth();
    }

    // --- AI helpers (no training) ---
    const FACE_X = WIDTH - (PADDLE_W + 10) - BALL_R; // ball-center x where it meets AI paddle
    const DEADZONE = 8;                               // avoid fidgeting when close
    const MIN_PRESS_MS = 120;
    let lastPress: 'up' | 'down' | 'none' = 'none';
    let lastPressAt = 0;

    function pressKey(key: 'ArrowUp' | 'ArrowDown') {
      const now = performance.now();
      // Avoid immediate flip-flop: keep previous press for a minimum duration
      if (lastPress !== 'none' && lastPress !== (key === 'ArrowUp' ? 'up' : 'down')) {
        if (now - lastPressAt < MIN_PRESS_MS) return;
      }
      // Release opposite
      const opp = key === 'ArrowUp' ? 'ArrowDown' : 'ArrowUp';
      window.dispatchEvent(new KeyboardEvent('keyup', { key: opp, bubbles: true }));
      // Press requested
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      lastPress = key === 'ArrowUp' ? 'up' : 'down';
      lastPressAt = now;
    }
    function releaseBoth() {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }));
      lastPress = 'none';
    }

    // Mirror y into [min, max] to emulate top/bottom bounces
    function reflectY(y: number, min: number, max: number) {
      const span = max - min;
      if (span <= 0) return min;
      let m = (y - min) % (2 * span);
      if (m < 0) m += 2 * span;
      return min + (m <= span ? m : 2 * span - m);
    }

    // Predict ball-center Y when it reaches FACE_X; includes bounce mirroring
    function predictYAtFace(bx: number, by: number, vx: number, vy: number): number | null {
      if (vx <= 0) return null;                 // not moving toward AI
      const t = (FACE_X - bx) / vx;             // seconds if vx is px/s
      if (t <= 0) return null;
      const rawY = by + vy * t;                 // linear extrapolation
      return reflectY(rawY, BALL_R, HEIGHT - BALL_R);
    }

    // 1 Hz “perception” (required by spec)
    function aiTick() {
      if (paused || !gameStarted) return;

      // Optional human-like delay: don’t commit until ball crosses midline
      // if (ballX < WIDTH / 2) { home(); return; }

      const targetBallY = predictYAtFace(ballX, ballY, ballVX, ballVY);

      // If ball is moving away or prediction invalid: drift to center
      if (targetBallY == null) { home(); return; }

      const targetCenter = clampCenter(targetBallY);
      const rCenter = rY + PADDLE_H / 2;
      const diff = targetCenter - rCenter;

      if (Math.abs(diff) <= DEADZONE) {
        releaseBoth();
      } else if (diff > 0) {
        pressKey('ArrowDown');
      } else {
        pressKey('ArrowUp');
      }
    }

    function home() {
      const center = HEIGHT / 2;
      const rCenter = rY + PADDLE_H / 2;
      const diff = center - rCenter;
      if (Math.abs(diff) <= DEADZONE) releaseBoth();
      else if (diff > 0) pressKey('ArrowDown');
      else pressKey('ArrowUp');
    }

    function clampCenter(y: number) {
      const minC = PADDLE_H / 2, maxC = HEIGHT - PADDLE_H / 2;
      return Math.max(minC, Math.min(maxC, y));
    }

    // Bind keys and start after countdown
    window.addEventListener('keydown', keyDown, { capture: true });
    window.addEventListener('keyup', keyUp, { capture: true });

    startCountdown(3, () => {
      gameStarted = true;
      last = performance.now();
      updateScoreboard();
      aiTick(); // first look
      aiTimer = window.setInterval(aiTick, 1000); // 1 Hz decisions
      raf = requestAnimationFrame(frame);
    });

    let aiTimer = 0;
  }

  return wrap;
};
