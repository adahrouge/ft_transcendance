// src/views/Game.ts
// Tournament match view, now gated behind a "Start Match" button.
// Updated to use WebSocket backend for real-time multiplayer

import { aliasOf, getState, reportScore, setMatchStatus } from '../state.js';
import { navigate } from '../router.js';
import { escapeHTML } from '../utils.js';
import { webSocketService } from '../websocket-service.js'; // New import

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360; // identical for both players
const BALL_SPEED = 340;
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

  // Pre-game UI: Start Match button
  wrap.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content: space-between; align-items: baseline;">
        <div><strong>${escapeHTML(aliasOf(m.p1))}</strong> vs <strong>${escapeHTML(aliasOf(m.p2))}</strong></div>
        <div class="score" id="score">0 : 0</div>
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="btn primary" id="start">Start Match</button>
        <a class="btn" data-link href="/tournament">Back</a>
      </div>
    </div>
    <div id="host" style="position:relative;"></div>
    <div id="connection-status" style="margin-top: 10px; padding: 10px; border-radius: 4px;"></div>
  `;

  let currentPlayerId: string | null = null;
  let gameConnected = false;

  (wrap.querySelector('#start') as HTMLButtonElement).onclick = () => startMatch();

  function updateConnectionStatus(message: string, isError: boolean = false) {
    const statusEl = wrap.querySelector('#connection-status') as HTMLDivElement;
    statusEl.textContent = message;
    statusEl.style.background = isError ? '#ffebee' : '#e8f5e8';
    statusEl.style.color = isError ? '#c62828' : '#2e7d32';
    statusEl.style.display = 'block';
  }

  function startMatch() {
    // Connect to WebSocket backend
    webSocketService.connect();
    updateConnectionStatus('🔄 Connecting to game server...');

    // Set up WebSocket listeners
    webSocketService.onGameStateUpdate((gameState) => {
      if (!gameState) return;
      
      updateGameFromBackend(gameState);
      
      if (!gameConnected) {
        gameConnected = true;
        updateConnectionStatus('✅ Connected to game server!');
        startLocalGame(); // Start the local game loop once connected
      }
    });

    // Create game on backend
    setTimeout(() => {
      webSocketService.createGame(
        aliasOf(m.p1) || 'Player 1',
        aliasOf(m.p2) || 'Player 2'
      );
    }, 1000);

    // Mark match as playing on start
    setMatchStatus(matchId, 'playing');
  }

  function startLocalGame() {
    const host = wrap.querySelector('#host') as HTMLDivElement;

    host.innerHTML = `
      <div class="row" style="margin-top:8px; gap:12px;">
        <button class="btn" id="pause">Pause</button>
        <button class="btn" id="quit">Quit match</button>
      </div>
      <div style="margin-top: 8px; color: #666;">
        <small>Playing as: <strong id="player-role">Connecting...</strong></small>
      </div>
    `;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    host.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;

    // State - now synced with backend
    let lY = HEIGHT / 2 - PADDLE_H / 2;
    let rY = HEIGHT / 2 - PADDLE_H / 2;
    let ballX = WIDTH / 2, ballY = HEIGHT / 2;
    let ballVX = 0, ballVY = 0;
    let scoreL = 0, scoreR = 0;
    let paused = false;
    let raf = 0;
    let gameStarted = false;

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

    // Pause / Quit
    (wrap.querySelector('#pause') as HTMLButtonElement).onclick = () => { 
      paused = !paused; 
    };
    (wrap.querySelector('#quit') as HTMLButtonElement).onclick = () => {
      if (confirm('Quit this match? Current score will be saved.')) endMatch();
    };

    function updateGameFromBackend(gameState: any) {
      if (!gameState || !gameState.players || !gameState.ball) return;

      // Update scores
      scoreL = gameState.players[0]?.score || 0;
      scoreR = gameState.players[1]?.score || 0;

      // Update paddle positions
      lY = gameState.players[0]?.paddleY || lY;
      rY = gameState.players[1]?.paddleY || rY;

      // Update ball position
      ballX = gameState.ball.x || ballX;
      ballY = gameState.ball.y || ballY;
      ballVX = gameState.ball.velocityX || ballVX;
      ballVY = gameState.ball.velocityY || ballVY;

      // Update player role display
      const playerRoleEl = wrap.querySelector('#player-role') as HTMLElement;
      if (currentPlayerId === 'player1') {
        playerRoleEl.textContent = `${aliasOf(m.p1)} (Left Paddle - W/S Keys)`;
      } else if (currentPlayerId === 'player2') {
        playerRoleEl.textContent = `${aliasOf(m.p2)} (Right Paddle - Arrow Keys)`;
      }

      updateScoreboard();
    }

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

    // Input handling - send movements to backend
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
      
      let newPosition: number | null = null;
      
      if ((e.key === 'w' || e.key === 'W') && currentPlayerId === 'player1') {
        newPosition = lY - 20;
      }
      if ((e.key === 's' || e.key === 'S') && currentPlayerId === 'player1') {
        newPosition = lY + 20;
      }
      if (e.key === 'ArrowUp' && currentPlayerId === 'player2') {
        newPosition = rY - 20;
      }
      if (e.key === 'ArrowDown' && currentPlayerId === 'player2') {
        newPosition = rY + 20;
      }
      
      if (newPosition !== null && gameConnected) {
        webSocketService.movePaddle(newPosition);
      }

      if (e.key === ' ') paused = !paused;
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
    };

    window.addEventListener('keydown', keyDown, { capture: true });
    window.addEventListener('keyup', keyUp, { capture: true });

    let last = 0;
    let acc = 0;
    const dt = 1000 / 60;

    function frame(now: number) {
      const elapsed = now - last;
      last = now;
      acc += elapsed;
      while (acc >= dt) {
        if (!paused && gameStarted) {
          step(dt / 1000);
        }
        acc -= dt;
      }
      render();
      if (isOver()) { 
        endMatch(); 
        return; 
      }
      raf = requestAnimationFrame(frame);
    }

    function step(dtSec: number) {
      // Game logic is now handled by the backend
      // We just render the state we receive via WebSocket
      updateScoreboard();
    }

    function render() {
      drawTable();
      drawPaddle(10, lY);
      drawPaddle(WIDTH - PADDLE_W - 10, rY);
      drawBall(ballX, ballY);
    }

    function isOver() { 
      return scoreL >= SCORE_TO_WIN || scoreR >= SCORE_TO_WIN; 
    }

    function teardown() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keyDown, { capture: true } as any);
      window.removeEventListener('keyup', keyUp, { capture: true } as any);
      webSocketService.disconnect();
    }

    function endMatch() {
      teardown();
      setMatchStatus(matchId, 'finished');
      reportScore(matchId, scoreL, scoreR);
      
      // Determine winner
      let winnerMessage = '';
      if (scoreL >= SCORE_TO_WIN) {
        winnerMessage = `${aliasOf(m.p1)} wins!`;
      } else if (scoreR >= SCORE_TO_WIN) {
        winnerMessage = `${aliasOf(m.p2)} wins!`;
      }
      
      alert(`Match ended. Final score: ${scoreL} : ${scoreR}\n${winnerMessage}`);
      navigate('/tournament');
    }

    // Handle WebSocket connection events
    const originalOnGameState = webSocketService.onGameStateUpdate;
    webSocketService.onGameStateUpdate((gameState) => {
      if (gameState && gameState.yourPlayerId) {
        currentPlayerId = gameState.yourPlayerId;
      }
      updateGameFromBackend(gameState);
      originalOnGameState.call(webSocketService, gameState);
    });

    // Countdown that respects Pause
    function startCountdown(seconds: number, onDone: () => void) {
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
            onDone();
          }, 300);
        }
      }
      requestAnimationFrame(tick);
    }

    // Start AFTER countdown
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