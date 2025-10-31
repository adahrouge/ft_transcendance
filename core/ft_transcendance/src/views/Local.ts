// src/views/Local.ts
import { navigate } from '../router.js';
import { escapeHTML, sanitizeAlias } from '../utils.js';

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360; // identical for both players
const BALL_SPEED = 340;
const SCORE_TO_WIN = 5;

export const LocalGameView = () => {
  const wrap = document.createElement('div');

  wrap.innerHTML = `
    <div class="card">
      <h2>Local 1v1 (Same Keyboard)</h2>
      <p class="muted">Left paddle: W/S · Right paddle: ↑/↓</p>
      <div class="row">
        <input class="input-field" id="p1" placeholder="Player 1 alias" value="Player 1" />
        <input class="input-field" id="p2" placeholder="Player 2 alias" value="Player 2" />
      </div>
      <div class="row">
        <button class="btn primary" id="start">Start Match</button>
        <a class="btn" data-link href="/">Back</a>
      </div>
    </div>
    <div id="game-host" style="position:relative;"></div>
  `;

  const host = wrap.querySelector('#game-host') as HTMLDivElement;

  (wrap.querySelector('#start') as HTMLButtonElement).onclick = () => {
    try {
      const p1 = sanitizeAlias((wrap.querySelector('#p1') as HTMLInputElement).value || 'Player 1');
      const p2 = sanitizeAlias((wrap.querySelector('#p2') as HTMLInputElement).value || 'Player 2');
      startGame(p1, p2);
    } catch (e: any) {
      alert(e?.message || 'Invalid alias');
    }
  };

  function startGame(p1Alias: string, p2Alias: string) {
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
    let lY = HEIGHT / 2 - PADDLE_H / 2;
    let rY = HEIGHT / 2 - PADDLE_H / 2;
    let ballX = WIDTH / 2, ballY = HEIGHT / 2;
    let ballVX = Math.random() < 0.5 ? BALL_SPEED : -BALL_SPEED;
    let ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;
    let keys = { w: false, s: false, up: false, down: false };
    let scoreL = 0, scoreR = 0;
    let paused = false;
    let raf = 0;
    let gameStarted = false;

    // Prevent page scroll while playing & allow pause during countdown
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
      if (e.key === 'w' || e.key === 'W') keys.w = true;
      if (e.key === 's' || e.key === 'S') keys.s = true;
      if (e.key === 'ArrowUp') keys.up = true;
      if (e.key === 'ArrowDown') keys.down = true;
      if (e.key === ' ') paused = !paused;   // ← freezes countdown too
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
      if (e.key === 'w' || e.key === 'W') keys.w = false;
      if (e.key === 's' || e.key === 'S') keys.s = false;
      if (e.key === 'ArrowUp') keys.up = false;
      if (e.key === 'ArrowDown') keys.down = false;
    };
    window.addEventListener('keydown', keyDown, { capture: true });
    window.addEventListener('keyup', keyUp, { capture: true });

    (wrap.querySelector('#pause') as HTMLButtonElement).onclick = () => { paused = !paused; };
    (wrap.querySelector('#quit') as HTMLButtonElement).onclick = () => {
      if (confirm('Quit this match?')) { teardown(); navigate('/'); }
    };

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

      if (keys.w) lY -= PADDLE_SPEED * dtSec;
      if (keys.s) lY += PADDLE_SPEED * dtSec;
      if (keys.up) rY -= PADDLE_SPEED * dtSec;
      if (keys.down) rY += PADDLE_SPEED * dtSec;
      lY = Math.max(0, Math.min(HEIGHT - PADDLE_H, lY));
      rY = Math.max(0, Math.min(HEIGHT - PADDLE_H, rY));

      ballX += ballVX * dtSec;
      ballY += ballVY * dtSec;

      if (ballY - BALL_R <= 0 && ballVY < 0) { ballVY *= -1; ballY = BALL_R; }
      if (ballY + BALL_R >= HEIGHT && ballVY > 0) { ballVY *= -1; ballY = HEIGHT - BALL_R; }

      if (ballX - BALL_R <= PADDLE_W + 10) {
        if (ballY >= lY && ballY <= lY + PADDLE_H && ballVX < 0) {
          ballVX *= -1;
          const rel = (ballY - (lY + PADDLE_H / 2)) / (PADDLE_H / 2);
          ballVY = rel * BALL_SPEED;
          ballX = PADDLE_W + 10 + BALL_R;
        } else if (ballX < 0) { scoreR++; serve(+1); }
      }
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
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      ctx.setLineDash([10, 15]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 10);
      ctx.lineTo(WIDTH / 2, HEIGHT - 10);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(10, lY, PADDLE_W, PADDLE_H);
      ctx.fillRect(WIDTH - PADDLE_W - 10, rY, PADDLE_W, PADDLE_H);

      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#f2f2ff';
      ctx.fill();
    }

    function serve(dir: number) {
      ballX = WIDTH / 2; ballY = HEIGHT / 2;
      ballVX = dir * BALL_SPEED;
      ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;
    }

    function updateScoreboard() {
      const el = wrap.querySelector('#score')!;
      el.textContent = `${scoreL} : ${scoreR}`;
    }

    function isOver() { return scoreL >= SCORE_TO_WIN || scoreR >= SCORE_TO_WIN; }

    function endMatch() {
      alert(`Match ended.\n${p1Alias}: ${scoreL} — ${p2Alias}: ${scoreR}`);
      teardown();
      navigate('/');
    }

    function teardown() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keyDown, { capture: true } as any);
      window.removeEventListener('keyup', keyUp, { capture: true } as any);
    }

    // ---- Countdown that respects Pause (just like AI view) ----
    function startCountdown(seconds: number, done: () => void) {
      let remainingMs = seconds * 1000;
      let lastTs = 0;
      let running = true;

      function tick(ts: number) {
        if (!running) return;
        if (!lastTs) lastTs = ts;

        const d = paused ? 0 : (ts - lastTs);
        lastTs = ts;
        remainingMs = Math.max(0, remainingMs - d);

        const secsInt = Math.ceil(remainingMs / 1000);
        if (secsInt > 0) {
          overlay.textContent = String(secsInt);
          requestAnimationFrame(tick);
        } else {
          overlay.textContent = 'Go!';
          setTimeout(() => {
            overlay.remove();
            running = false;
            done();
          }, 300);
        }
      }
      requestAnimationFrame(tick);
    }

    // Start AFTER countdown (which can be paused)
    updateScoreboard();
    render(); // draw initial table/paddles/ball
    startCountdown(3, () => {
      gameStarted = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });
  }

  return wrap;
};
