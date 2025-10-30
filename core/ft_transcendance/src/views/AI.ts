// src/views/AI.ts
// Play vs AI using deterministic 1 Hz controller with mirrored-wall prediction,
// hysteresis lock/unlock, deadzone, and emergency intercept.

import { navigate } from '../router.js';
import { escapeHTML } from '../utils.js';
import { AIController } from '../ai/controller.js';

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360; // must match human
const BALL_SPEED = 340;
const SCORE_TO_WIN = 5;

const MIN_PRESS_MS = 140; // avoid rapid flip-flop

export const AIGameView = () => {
  const wrap = document.createElement('div');

  const p1Alias = 'You';
  const p2Alias = 'AI';

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

    // ---- Game State ----
    let lY = HEIGHT / 2 - PADDLE_H / 2; // human (W/S)
    let rY = HEIGHT / 2 - PADDLE_H / 2; // AI (ArrowUp/ArrowDown via synthetic events)
    let ballX = WIDTH / 2, ballY = HEIGHT / 2;
    let ballVX = Math.random() < 0.5 ? BALL_SPEED : -BALL_SPEED;
    let ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;

    let keys = { w: false, s: false, up: false, down: false };
    let scoreL = 0, scoreR = 0;
    let paused = false;
    let raf = 0;
    let gameStarted = false;

    const ctrl = new AIController();

    // ---- Countdown overlay ----
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
        if (t > 0) {
          overlay.textContent = String(t);
        } else {
          overlay.textContent = 'Go!';
          setTimeout(() => {
            overlay.remove();
            clearInterval(iv);
            done();
          }, 400);
        }
      }, 1000);
    }

    // ---- Drawing ----
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

    // ---- Input Handling ----
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();

      if (e.key === 'w' || e.key === 'W') keys.w = true;
      if (e.key === 's' || e.key === 'S') keys.s = true;

      // Only synthetic Arrow keys (AI) are honored
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

    // ---- Physics loop (fixed timestep) ----
    let last = 0;
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

      // AI (synthetic Arrow keys)
      if (keys.up) rY -= PADDLE_SPEED * dtSec;
      if (keys.down) rY += PADDLE_SPEED * dtSec;

      lY = Math.max(0, Math.min(HEIGHT - PADDLE_H, lY));
      rY = Math.max(0, Math.min(HEIGHT - PADDLE_H, rY));

      // Ball integration
      ballX += ballVX * dtSec;
      ballY += ballVY * dtSec;

      // Walls
      if (ballY - BALL_R <= 0 && ballVY < 0) { ballVY *= -1; ballY = BALL_R; }
      if (ballY + BALL_R >= HEIGHT && ballVY > 0) { ballVY *= -1; ballY = HEIGHT - BALL_R; }

      // Left paddle collision / score
      if (ballX - BALL_R <= PADDLE_W + 10) {
        if (ballY >= lY && ballY <= lY + PADDLE_H && ballVX < 0) {
          ballVX *= -1;
          const rel = (ballY - (lY + PADDLE_H / 2)) / (PADDLE_H / 2);
          ballVY = rel * BALL_SPEED;
          ballX = PADDLE_W + 10 + BALL_R;
        } else if (ballX < 0) { scoreR++; onPointOver(+1); }
      }

      // Right paddle collision / score
      if (ballX + BALL_R >= WIDTH - (PADDLE_W + 10)) {
        if (ballY >= rY && ballY <= rY + PADDLE_H && ballVX > 0) {
          ballVX *= -1;
          const rel = (ballY - (rY + PADDLE_H / 2)) / (PADDLE_H / 2);
          ballVY = rel * BALL_SPEED;
          ballX = WIDTH - (PADDLE_W + 10) - BALL_R;
        } else if (ballX > WIDTH) { scoreL++; onPointOver(-1); }
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

      // Reset AI intent
      ctrl.reset();
      releaseKey('ArrowUp'); releaseKey('ArrowDown');
      lastPress = 'none';
    }

    function onPointOver(nextDir: number) {
      serve(nextDir);
    }

    function isOver() { return scoreL >= SCORE_TO_WIN || scoreR >= SCORE_TO_WIN; }

    function endMatch() {
      alert(`Match ended.\n${p1Alias}: ${scoreL} — ${p2Alias}: ${scoreR}`);
      teardown();
      navigate('/');
    }

    // ---- AI synthetic key helpers ----
    let lastPress: 'up' | 'down' | 'none' = 'none';
    let lastPressAt = 0;

    function pressKey(key: 'ArrowUp' | 'ArrowDown') {
      const now = performance.now();
      if (lastPress !== 'none' && lastPress !== (key === 'ArrowUp' ? 'up' : 'down')) {
        if (now - lastPressAt < MIN_PRESS_MS) return; // too soon to flip
      }
      if (key === 'ArrowUp') releaseKey('ArrowDown'); else releaseKey('ArrowUp');

      const ev = new KeyboardEvent('keydown', { key, bubbles: true });
      window.dispatchEvent(ev);
      lastPress = key === 'ArrowUp' ? 'up' : 'down';
      lastPressAt = now;
    }

    function releaseKey(key: 'ArrowUp' | 'ArrowDown') {
      const ev = new KeyboardEvent('keyup', { key, bubbles: true });
      window.dispatchEvent(ev);
      if ((key === 'ArrowUp' && lastPress === 'up') || (key === 'ArrowDown' && lastPress === 'down')) {
        lastPress = 'none';
      }
    }

    // ---- AI perception @ 1 Hz ----
    let aiTickTimer = 0;

    function aiTick() {
      if (paused || !gameStarted) return;

      const snapshot = {
        width: WIDTH,
        height: HEIGHT,
        paddleY: rY,
        paddleH: PADDLE_H,
        ballX,
        ballY,
        ballVX,
        ballVY,
        towardAI: ballVX > 0,
      } as const;

      const action = ctrl.decide(snapshot);

      const now = performance.now();
      const canFlip = lastPress === 'none' || now - lastPressAt >= MIN_PRESS_MS;

      if (action === 'none') {
        releaseKey('ArrowUp'); releaseKey('ArrowDown');
      } else if (action === 'up') {
        if (lastPress !== 'up' && !canFlip) return;
        pressKey('ArrowUp');
      } else if (action === 'down') {
        if (lastPress !== 'down' && !canFlip) return;
        pressKey('ArrowDown');
      }
    }

    function teardown() {
      cancelAnimationFrame(raf);
      clearInterval(aiTickTimer);
      window.removeEventListener('keydown', keyDown, { capture: true } as any);
      window.removeEventListener('keyup', keyUp, { capture: true } as any);
      releaseKey('ArrowUp'); releaseKey('ArrowDown');
    }

    // Bind inputs and start after countdown
    window.addEventListener('keydown', keyDown, { capture: true });
    window.addEventListener('keyup', keyUp, { capture: true });

    startCountdown(3, () => {
      gameStarted = true;
      let first = performance.now();
      last = first;
      updateScoreboard();
      aiTick(); // first look
      aiTickTimer = window.setInterval(aiTick, 1000); // 1 Hz perception
      raf = requestAnimationFrame(frame);
    });
  }

  return wrap;
};
