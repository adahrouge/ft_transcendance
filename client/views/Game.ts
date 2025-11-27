// src/views/Game.ts
// Tournament match view, now gated behind a "Start Match" button.
// Updated to use WebSocket backend for real-time multiplayer

import { aliasOf, getState, reportScore, setMatchStatus } from '../state.js';
import { navigate } from '../router.js';
import { escapeHTML } from '../utils.js';
import { webSocketService } from '../websocket-service.js';
import { getToken } from '../api.js';
import { gameAPI, tournamentAPI } from '../api.js';

const WIDTH = 960;
const HEIGHT = 540;
const PADDLE_W = 14;
const PADDLE_H = 90;
const BALL_R = 8;
const PADDLE_SPEED = 360; // identical for both players
const BALL_SPEED = 340;
const SCORE_TO_WIN = 5;

export const GameView = async (params: Record<string, string>) => {
  const matchId = params.id;
  const wrap = document.createElement('div');
  
  // Check if this is a tournament match (format: t{tournamentId}-m{matchId})
  let tournamentMatch: any = null;
  let tournamentId: number | null = null;
  let isTournamentMatch = false;
  
  if (matchId.startsWith('t') && matchId.includes('-m')) {
    isTournamentMatch = true;
    const parts = matchId.match(/^t(\d+)-m(\d+)$/);
    if (parts) {
      tournamentId = parseInt(parts[1]);
      const dbMatchId = parseInt(parts[2]);
      try {
        const result = await tournamentAPI.getTournament(tournamentId);
        const matches = result.tournament.matches || [];
        tournamentMatch = matches.find((m: any) => m.id === dbMatchId);
      } catch (err) {
        console.error('Error loading tournament match:', err);
      }
    }
  }
  
  // If tournament match not found, try client-side state
  const s = getState();
  const m = tournamentMatch ? null : s.matches.find((m) => m.id === matchId);

  if (!m && !tournamentMatch) {
    wrap.innerHTML = `<div class="card"><p>Match not found.</p><button class="btn" id="back">Back</button></div>`;
    (wrap.querySelector('#back') as HTMLButtonElement).onclick = () => navigate('/tournament');
    return wrap;
  }
  
  // Use tournament match data if available
  const matchData = tournamentMatch ? {
    id: matchId,
    p1: tournamentMatch.p1_is_bot ? tournamentMatch.p1_bot_name : (tournamentMatch.p1_display_name || tournamentMatch.p1_username),
    p2: tournamentMatch.p2_is_bot ? tournamentMatch.p2_bot_name : (tournamentMatch.p2_display_name || tournamentMatch.p2_username),
    p1Id: tournamentMatch.player1_id,
    p2Id: tournamentMatch.player2_id,
    tournamentId: tournamentId,
    dbMatchId: tournamentMatch.id
  } : m;

  // Pre-game UI: Start Match button
  const p1Name = matchData.p1 || 'Player 1';
  const p2Name = matchData.p2 || 'Player 2';
  
  wrap.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content: space-between; align-items: baseline;">
        <div><strong>${escapeHTML(p1Name)}</strong> vs <strong>${escapeHTML(p2Name)}</strong></div>
        <div class="score" id="score">0 : 0</div>
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="btn primary" id="start">Start Match</button>
        <button class="btn outline" id="join-spectator" style="display:none;">Join as Spectator</button>
        <a class="btn" data-link href="/tournament">Back</a>
      </div>
      <div id="spectator-count" style="margin-top:8px; color:#aaa; font-size:14px; display:none;">
        <span id="spectator-count-value">0</span> spectator(s) watching
      </div>
    </div>
    <div style="display:flex; gap:16px; margin-top:16px;">
      <div id="host" style="position:relative; flex:2; min-width:0;"></div>
      <div class="card" style="flex:1; min-width:300px; max-height:600px; display:flex; flex-direction:column;">
        <h3 style="margin-bottom:12px;">Live Chat</h3>
        <div id="chat-messages" style="flex:1; overflow-y:auto; min-height:200px; max-height:450px; padding:8px; background:#1a1a1a; border-radius:8px; margin-bottom:12px;">
          <div style="color:#888; font-size:12px; text-align:center; padding:16px;">No messages yet. Start chatting!</div>
        </div>
        <div style="display:flex; gap:8px;">
          <input type="text" id="chat-input" placeholder="Type a message..." style="flex:1; padding:8px; background:#333; border:none; border-radius:6px; color:#fff; font-size:14px;" />
          <button class="btn primary" id="chat-send" style="padding:8px 16px;">Send</button>
        </div>
        <div style="margin-top:8px; font-size:12px; color:#888;">
          <span id="spectator-info">Join to watch and chat!</span>
        </div>
      </div>
    </div>
    <div id="connection-status" style="margin-top: 10px; padding: 10px; border-radius: 4px; display:none;"></div>
  `;

  let currentPlayerId: string | null = null;
  let gameConnected = false;
  let isSpectator = false;
  let currentGameId: string | null = null;
  const chatMessages: any[] = [];

  const token = getToken();
  
  // Connect WebSocket with authentication if available
  function connectWebSocket() {
    webSocketService.connect(token || undefined);
  }

  // Check for existing active game on load
  checkForActiveGame();

  (wrap.querySelector('#start') as HTMLButtonElement).onclick = () => startMatch();
  (wrap.querySelector('#join-spectator') as HTMLButtonElement).onclick = () => joinAsSpectator();
  (wrap.querySelector('#chat-send') as HTMLButtonElement).onclick = () => sendChatMessage();

  async function checkForActiveGame() {
    try {
      // Try to find an active game by checking all active games
      // In a real scenario, you'd map matchId to gameId, but for now we'll use a simple approach
      const response = await gameAPI.getActiveGames();
      if (response.games && response.games.length > 0) {
        // Show join button
        const joinBtn = wrap.querySelector('#join-spectator') as HTMLButtonElement;
        if (joinBtn) {
          joinBtn.style.display = 'inline-block';
          joinBtn.textContent = `Join as Spectator (${response.games.length} active game${response.games.length > 1 ? 's' : ''})`;
        }
        
        // If there's exactly one game, we could auto-join
        // For now, user needs to click the button
      }
    } catch (err) {
      console.log('No active games found or error checking:', err);
    }
  }
  
  const chatInput = wrap.querySelector('#chat-input') as HTMLInputElement;
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  function updateConnectionStatus(message: string, isError: boolean = false) {
    const statusEl = wrap.querySelector('#connection-status') as HTMLDivElement;
    statusEl.textContent = message;
    statusEl.style.background = isError ? '#ffebee' : '#e8f5e8';
    statusEl.style.color = isError ? '#c62828' : '#2e7d32';
    statusEl.style.display = 'block';
  }

  function updateSpectatorCount(count: number) {
    const countEl = wrap.querySelector('#spectator-count-value') as HTMLElement;
    const countContainer = wrap.querySelector('#spectator-count') as HTMLElement;
    if (countEl) countEl.textContent = String(count);
    if (countContainer) countContainer.style.display = count > 0 ? 'block' : 'none';
  }

  function addChatMessage(message: any) {
    chatMessages.push(message);
    renderChatMessages();
  }

  function renderChatMessages() {
    const chatContainer = wrap.querySelector('#chat-messages') as HTMLDivElement;
    if (!chatContainer) return;

    if (chatMessages.length === 0) {
      chatContainer.innerHTML = '<div style="color:#888; font-size:12px; text-align:center; padding:16px;">No messages yet. Start chatting!</div>';
      return;
    }

    chatContainer.innerHTML = chatMessages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      return `
        <div style="margin-bottom:8px; padding:6px; background:#222; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong style="color:#5e81f4; font-size:12px;">${escapeHTML(msg.username)}</strong>
            <span style="color:#666; font-size:11px;">${time}</span>
          </div>
          <div style="color:#ddd; font-size:13px; word-wrap:break-word;">${escapeHTML(msg.message)}</div>
        </div>
      `;
    }).join('');

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function sendChatMessage() {
    const input = chatInput;
    if (!input || !input.value.trim() || !gameConnected) return;
    
    webSocketService.sendChatMessage(input.value);
    input.value = '';
  }

  function startMatch() {
    // Check if user is authenticated
    if (!token) {
      updateConnectionStatus('❌ You must be logged in to start a match. Please login first.', true);
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      return;
    }

    connectWebSocket();
    updateConnectionStatus('🔄 Connecting to game server...');

    // Set up WebSocket listeners
    setupWebSocketListeners();

    // Create game on backend (requires authentication)
    setTimeout(() => {
      if (matchData) {
        const p1Name = matchData.p1 || 'Player 1';
        const p2Name = matchData.p2 || 'Player 2';
        webSocketService.createGame(p1Name, p2Name);
      }
    }, 1000);

    // Mark match as playing on start (only for client-side matches)
    if (!isTournamentMatch && m) {
      setMatchStatus(matchId, 'playing');
    }
  }

  async function joinAsSpectator() {
    isSpectator = true;
    updateConnectionStatus('🔄 Looking for active games...');
    
    try {
      // Get list of active games
      const response = await gameAPI.getActiveGames();
      if (response.games && response.games.length > 0) {
        // Join the first active game (or you could show a list to choose)
        const gameToJoin = response.games[0];
        currentGameId = gameToJoin.id;
        
        connectWebSocket();
        setupWebSocketListeners();
        
        setTimeout(() => {
          webSocketService.joinGame(currentGameId!);
        }, 500);
      } else {
        updateConnectionStatus('❌ No active games found. Start a match first!', true);
      }
    } catch (err) {
      updateConnectionStatus('❌ Error finding games. Please try again.', true);
      console.error('Error joining as spectator:', err);
    }
  }

  function setupWebSocketListeners() {
    webSocketService.onGameStateUpdate((gameState) => {
      if (!gameState) return;
      
      // This will be handled inside startLocalGame or startSpectatorView
      if (!gameConnected) {
        gameConnected = true;
        updateConnectionStatus('✅ Connected to game server!');
        currentGameId = webSocketService.getCurrentGameId();
        
        if (!isSpectator) {
          startLocalGame(); // Start the local game loop once connected
        } else {
          startSpectatorView(); // Start spectator view
        }
      }
      // Game state updates are handled within startLocalGame/startSpectatorView
    });

    webSocketService.onChatMessage((message) => {
      addChatMessage(message);
    });
  }

  function startSpectatorView() {
    const host = wrap.querySelector('#host') as HTMLDivElement;
    
    host.innerHTML = `
      <div style="padding:16px; background:#222; border-radius:8px; margin-bottom:16px;">
        <h3 style="margin-bottom:8px;">Spectator Mode</h3>
        <p style="color:#aaa; font-size:14px;">You are watching this match live. Chat with other spectators below!</p>
      </div>
    `;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    host.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;

    // State
    let lY = HEIGHT / 2 - PADDLE_H / 2;
    let rY = HEIGHT / 2 - PADDLE_H / 2;
    let ballX = WIDTH / 2, ballY = HEIGHT / 2;
    let scoreL = 0, scoreR = 0;

    function updateSpectatorGameState(gameState: any) {
      if (!gameState || !gameState.players || !gameState.ball) return;

      scoreL = gameState.players[0]?.score || 0;
      scoreR = gameState.players[1]?.score || 0;
      lY = gameState.players[0]?.paddleY || lY;
      rY = gameState.players[1]?.paddleY || rY;
      ballX = gameState.ball.x || ballX;
      ballY = gameState.ball.y || ballY;

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

    function render() {
      drawTable();
      drawPaddle(10, lY);
      drawPaddle(WIDTH - PADDLE_W - 10, rY);
      drawBall(ballX, ballY);
    }

    updateScoreboard();
    render();

    // Render loop for spectators (visual only)
    let lastFrame = performance.now();
    function frame(now: number) {
      render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Update spectator info
    const spectatorInfo = wrap.querySelector('#spectator-info') as HTMLElement;
    if (spectatorInfo) {
      spectatorInfo.textContent = 'You are watching as a spectator';
    }
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
      const role = webSocketService.getUserRole();
      if (role === 'player1' && m) {
        playerRoleEl.textContent = `${aliasOf(m.p1)} (Left Paddle - W/S Keys)`;
        currentPlayerId = 'player1';
      } else if (role === 'player2' && m) {
        playerRoleEl.textContent = `${aliasOf(m.p2)} (Right Paddle - Arrow Keys)`;
        currentPlayerId = 'player2';
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

    async function endMatch() {
      teardown();
      
      // Determine winner
      let winnerMessage = '';
      let winnerId: number | null = null;
      
      if (isTournamentMatch && matchData.tournamentId && matchData.dbMatchId) {
        // Tournament match - save to database
        if (scoreL >= SCORE_TO_WIN) {
          winnerId = matchData.p1Id;
          winnerMessage = `${matchData.p1} wins!`;
        } else if (scoreR >= SCORE_TO_WIN) {
          winnerId = matchData.p2Id;
          winnerMessage = `${matchData.p2} wins!`;
        }
        
        try {
          // Update tournament match result
          const response = await fetch(`/api/tournaments/${matchData.tournamentId}/matches/${matchData.dbMatchId}/result`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              player1_score: scoreL,
              player2_score: scoreR,
              winner_id: winnerId
            })
          });
          
          if (!response.ok) {
            console.error('Failed to update tournament match result');
          }
        } catch (err) {
          console.error('Error updating tournament match:', err);
        }
        
        alert(`Match ended. Final score: ${scoreL} : ${scoreR}\n${winnerMessage}`);
        navigate(`/tournament/${matchData.tournamentId}`);
      } else if (m) {
        // Client-side match
        setMatchStatus(matchId, 'finished');
        reportScore(matchId, scoreL, scoreR);
        
        if (scoreL >= SCORE_TO_WIN) {
          winnerMessage = `${aliasOf(m.p1)} wins!`;
        } else if (scoreR >= SCORE_TO_WIN) {
          winnerMessage = `${aliasOf(m.p2)} wins!`;
        }
        
        alert(`Match ended. Final score: ${scoreL} : ${scoreR}\n${winnerMessage}`);
        navigate('/tournament');
      }
    }

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
