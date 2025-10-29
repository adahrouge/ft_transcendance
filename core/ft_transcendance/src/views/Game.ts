import { aliasOf, getState, reportScore, setMatchStatus } from '../state.js';
import { navigate } from '../router.js';

const WIDTH = 960;  // canvas logic width
const HEIGHT = 540; // canvas logic height
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360; // px/sec — identical for both players
const BALL_SPEED = 340;   // starting speed
const SCORE_TO_WIN = 5;

export const GameView = (params: Record<string, string>) => {
  const matchId = params.id;
  const s = getState();
  const m = s.matches.find((m) => m.id === matchId);
  const wrap = document.createElement('div');

  if (!m) {
    wrap.innerHTML = `<div class="card"><p>Match not found.</p><button class="btn" id="back">Back</button></div>`;
    (wrap.querySelector('#back') as HTMLButtonElement).onclick = () => navigate('/tournament');
    return wrap;
  }

  // Header card
  wrap.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content: space-between; align-items: baseline;">
        <div><strong>${aliasOf(m.p1)}</strong> vs <strong>${aliasOf(m.p2)}</strong></div>
        <div class="score" id="score">0 : 0</div>
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="btn" id="pause">Pause</button>
        <button class="btn" id="quit">Quit match</button>
      </div>
    </div>
  `;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  wrap.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  // Game state
  let lY = HEIGHT / 2 - PADDLE_H / 2;
  let rY = HEIGHT / 2 - PADDLE_H / 2;
  let ballX = WIDTH / 2,
    ballY = HEIGHT / 2;
  let ballVX = Math.random() < 0.5 ? BALL_SPEED : -BALL_SPEED;
  let ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;
  let keys = { w: false, s: false, up: false, down: false };
  let scoreL = 0,
    scoreR = 0;
  let paused = false;

  setMatchStatus(matchId, 'playing');

  function drawTable() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Middle dashed line
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
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === ' ') paused = !paused; // space toggles pause
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
  });

  (wrap.querySelector('#pause') as HTMLButtonElement).onclick = () => {
    paused = !paused;
  };
  (wrap.querySelector('#quit') as HTMLButtonElement).onclick = () => {
    if (confirm('Quit this match? Current score will be saved.')) {
      endMatch();
    }
  };

  // Fixed timestep loop
  let last = performance.now();
  let acc = 0;
  const dt = 1000 / 60; // ms

  function frame(now: number) {
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
    requestAnimationFrame(frame);
  }

  function step(dtSec: number) {
    if (paused) return;
    // Move paddles – identical capped speed
    if (keys.w) lY -= PADDLE_SPEED * dtSec;
    if (keys.s) lY += PADDLE_SPEED * dtSec;
    if (keys.up) rY -= PADDLE_SPEED * dtSec;
    if (keys.down) rY += PADDLE_SPEED * dtSec;
    lY = Math.max(0, Math.min(HEIGHT - PADDLE_H, lY));
    rY = Math.max(0, Math.min(HEIGHT - PADDLE_H, rY));

    // Move ball
    ballX += ballVX * dtSec;
    ballY += ballVY * dtSec;

    // Collide with top/bottom
    if (ballY - BALL_R <= 0 && ballVY < 0) {
      ballVY *= -1;
      ballY = BALL_R;
    }
    if (ballY + BALL_R >= HEIGHT && ballVY > 0) {
      ballVY *= -1;
      ballY = HEIGHT - BALL_R;
    }

    // Collide with left paddle
    if (ballX - BALL_R <= PADDLE_W + 10) {
      if (ballY >= lY && ballY <= lY + PADDLE_H && ballVX < 0) {
        ballVX *= -1;
        const rel = (ballY - (lY + PADDLE_H / 2)) / (PADDLE_H / 2);
        ballVY = rel * BALL_SPEED; // add angle based on hit position
        ballX = PADDLE_W + 10 + BALL_R;
      } else if (ballX < 0) {
        // Right scores
        scoreR++;
        serve(+1);
      }
    }

    // Collide with right paddle
    if (ballX + BALL_R >= WIDTH - (PADDLE_W + 10)) {
      if (ballY >= rY && ballY <= rY + PADDLE_H && ballVX > 0) {
        ballVX *= -1;
        const rel = (ballY - (rY + PADDLE_H / 2)) / (PADDLE_H / 2);
        ballVY = rel * BALL_SPEED;
        ballX = WIDTH - (PADDLE_W + 10) - BALL_R;
      } else if (ballX > WIDTH) {
        // Left scores
        scoreL++;
        serve(-1);
      }
    }
    updateScoreboard();
  }

  function render() {
    drawTable();
    // left paddle at x=10
    drawPaddle(10, lY);
    // right paddle at x=WIDTH - PADDLE_W - 10
    drawPaddle(WIDTH - PADDLE_W - 10, rY);
    drawBall(ballX, ballY);
  }

  function serve(dir: number) {
    // dir: +1 towards right, -1 towards left
    ballX = WIDTH / 2;
    ballY = HEIGHT / 2;
    ballVX = dir * BALL_SPEED;
    ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.6;
  }

  function isOver() {
    return scoreL >= SCORE_TO_WIN || scoreR >= SCORE_TO_WIN;
  }

  function endMatch() {
    setMatchStatus(matchId, 'finished');
    reportScore(matchId, scoreL, scoreR);
    alert(`Match ended. Final score: ${scoreL} : ${scoreR}`);
    navigate('/tournament');
  }

  requestAnimationFrame(frame);
  updateScoreboard();
  return wrap;
};
