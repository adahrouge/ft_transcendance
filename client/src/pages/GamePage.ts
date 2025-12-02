// src/views/Game.ts
// Tournament match view, now gated behind a "Start Match" button.
// Updated to use WebSocket backend for real-time multiplayer

import { aliasOf, getState, reportScore, setMatchStatus } from '../utils/tournament.js';
import { navigate } from '../router.js';
import { escapeHTML } from '../utils/utils.js';
import { webSocketService } from '../services/websocket.js';
import { getToken } from '../services/api.js';
import { gameAPI, tournamentAPI } from '../services/api.js';
import { StrongPaddleAI, type AIConfig, type BallState } from '../utils/ai.js';
import { getCurrentUser } from '../utils/user.js';

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
      } catch (err: any) {
        console.error('Error loading tournament match:', err);
      }
    }
  }

  // If tournament match not found, try client-side state
  const s = getState();
  const m = tournamentMatch ? null : s.matches.find((m) => m.id === matchId);

  if (!m && !tournamentMatch) {
    wrap.innerHTML = `<div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65"><p>Match not found.</p><button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" id="back">Back</button></div>`;
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
    p1IsBot: tournamentMatch.p1_is_bot || false,
    p2IsBot: tournamentMatch.p2_is_bot || false,
    p1UserId: tournamentMatch.p1_user_id,
    p2UserId: tournamentMatch.p2_user_id,
    tournamentId: tournamentId,
    dbMatchId: tournamentMatch.id
  } : m;

  // Null check for matchData
  if (!matchData) {
    wrap.innerHTML = `<div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65"><p>Match data unavailable.</p><button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" id="back">Back</button></div>`;
    (wrap.querySelector('#back') as HTMLButtonElement).onclick = () => navigate('/tournament');
    return wrap;
  }

  // Check if either player is a bot (for AI control)
  const isP1Bot = tournamentMatch ? (tournamentMatch.p1_is_bot || false) : false;
  const isP2Bot = tournamentMatch ? (tournamentMatch.p2_is_bot || false) : false;
  const currentUser = getCurrentUser();
  const isUserP1 = currentUser && tournamentMatch && !isP1Bot &&
    (tournamentMatch.p1_user_id === currentUser.id);
  const isUserP2 = currentUser && tournamentMatch && !isP2Bot &&
    (tournamentMatch.p2_user_id === currentUser.id);

  // Pre-game UI: Start Match button
  const p1Name = matchData.p1 || 'Player 1';
  const p2Name = matchData.p2 || 'Player 2';

  wrap.innerHTML = `
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <div class="flex items-start gap-5 mt-4 flex-wrap justify-between items-baseline">
        <div><strong>${escapeHTML(p1Name)}</strong> vs <strong>${escapeHTML(p2Name)}</strong></div>
        <div class="inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-gray-200 font-semibold text-sm tracking-wider uppercase border border-indigo-400/60" id="score">0 : 0</div>
      </div>
      <div class="flex items-start gap-5 mt-4 flex-wrap mt-2">
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="start">Start Match</button>
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px hidden" id="join-spectator">Join as Spectator</button>
        <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" data-link href="/tournament">Back</a>
      </div>
      <div id="spectator-count" class="mt-2 text-gray-400 text-sm hidden">
        <span id="spectator-count-value">0</span> spectator(s) watching
      </div>
    </div>
    <div class="flex gap-4 mt-4">
      <div id="host" class="relative flex-[2] min-w-0"></div>
      <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 flex-1 min-w-[300px] max-h-[600px] flex flex-col">
        <h3 class="mb-3">Live Chat</h3>
        <div id="chat-messages" class="flex-1 overflow-y-auto min-h-[200px] max-h-[450px] p-2 bg-[#1a1a1a] rounded-lg mb-3">
          <div class="text-gray-400 text-xs text-center p-4">No messages yet. Start chatting!</div>
        </div>
        <div class="flex gap-2">
          <input type="text" id="chat-input" placeholder="Type a message..." class="flex-1 p-2 bg-[#333] border-0 rounded-md text-white text-sm" />
          <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="chat-send">Send</button>
        </div>
        <div class="mt-2 text-xs text-gray-400">
          <span id="spectator-info">Join to watch and chat!</span>
        </div>
      </div>
    </div>
    <div id="connection-status" class="hidden"></div>
    <style>
      #connection-status {
        display: none !important;
      }
    </style>
  `;

  let currentPlayerId: string | null = null;
  let gameConnected = false;
  let isSpectator = false;
  let currentGameId: string | null = null;
  const chatMessages: any[] = [];
  let updateGameStateRef: ((gameState: any) => void) | null = null;

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
    } catch (err: any) {
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

  // Spectator count update function (currently unused but may be needed for future features)
  // @ts-expect-error - Reserved for future spectator count feature
  function _updateSpectatorCount(count: number) {
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
      chatContainer.innerHTML = '<div class="text-gray-400 text-xs text-center p-4">No messages yet. Start chatting!</div>';
      return;
    }

    chatContainer.innerHTML = chatMessages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      return `
        <div class="mb-2 p-1.5 bg-[#222] rounded">
          <div class="flex justify-between mb-1">
            <strong class="text-[#5e81f4] text-xs">${escapeHTML(msg.username)}</strong>
            <span class="text-[#666] text-[11px]">${time}</span>
          </div>
          <div class="text-[#ddd] text-[13px] break-words">${escapeHTML(msg.message)}</div>
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
      if (!matchData) return;
      const p1NameToSend = matchData.p1 || 'Player 1';
      const p2NameToSend = matchData.p2 || 'Player 2';
      // Include bot information if this is a tournament match with bots
      // For tournament matches, send user IDs (not tournament player IDs) so server can determine role
      const p1Id = isTournamentMatch && isP1Bot && 'p1Id' in matchData ? 'bot_' + String(matchData.p1Id) :
                   (isTournamentMatch && 'p1UserId' in matchData && matchData.p1UserId ? matchData.p1UserId.toString() : undefined);
      const p2Id = isTournamentMatch && isP2Bot && 'p2Id' in matchData ? 'bot_' + String(matchData.p2Id) :
                   (isTournamentMatch && 'p2UserId' in matchData && matchData.p2UserId ? matchData.p2UserId.toString() : undefined);
      webSocketService.createGame(p1NameToSend, p2NameToSend, p2Id, p1Id);
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
    } catch (err: any) {
      updateConnectionStatus('❌ Error finding games. Please try again.', true);
      console.error('Error joining as spectator:', err);
    }
  }

  // Store updateGameFromBackend function reference for WebSocket updates

  function setupWebSocketListeners() {
    webSocketService.onGameStateUpdate((gameState) => {
      if (!gameState) return;

      // This will be handled inside startLocalGame or startSpectatorView
      if (!gameConnected) {
        gameConnected = true;
        // Don't show connection status message
        currentGameId = webSocketService.getCurrentGameId();

        if (!isSpectator) {
          startLocalGame(); // Start the local game loop once connected
        } else {
          startSpectatorView(); // Start spectator view
        }
      }

      // Update game state for rendering and AI calculations
      if (gameState.id === currentGameId && updateGameStateRef) {
        updateGameStateRef(gameState);
      }
    });

    webSocketService.onChatMessage((message) => {
      addChatMessage(message);
    });
  }

  function startSpectatorView() {
    const host = wrap.querySelector('#host') as HTMLDivElement;

    host.innerHTML = `
      <div class="p-4 bg-[#222] rounded-lg mb-4">
        <h3 class="mb-2">Spectator Mode</h3>
        <p class="text-gray-400 text-sm">You are watching this match live. Chat with other spectators below!</p>
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

    // Spectator game state update function (currently unused but may be needed for future features)
    // @ts-expect-error - Reserved for future spectator mode enhancements
    function _updateSpectatorGameState(gameState: any) {
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
    function frame() {
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
      <div class="flex items-start gap-5 mt-4 flex-wrap mt-2 gap-3">
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" id="pause">Pause</button>
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" id="quit">Quit match</button>
      </div>
      <div class="mt-2 text-[#666]">
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

    // AI for bot players
    let aiP1: StrongPaddleAI | null = null;
    let aiP2: StrongPaddleAI | null = null;
    const VISION_MS = 1000;
    let nextVisionTs = 0;
    let sampledBall: BallState = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };

    // Initialize AI if bots are present
    if (isTournamentMatch) {
      const aiConfig: AIConfig = {
        tableW: WIDTH,
        tableH: HEIGHT,
        paddleH: PADDLE_H,
        paddleX: 10, // left paddle x position
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
      };

      if (isP1Bot) {
        aiP1 = new StrongPaddleAI(aiConfig);
      }

      if (isP2Bot) {
        // For right paddle, adjust paddleX
        aiP2 = new StrongPaddleAI({
          ...aiConfig,
          paddleX: WIDTH - (PADDLE_W + 10), // right paddle x position
        });
      }
    }

    function updateAIVision(nowMs: number) {
      if (nowMs >= nextVisionTs) {
        sampledBall = { x: ballX, y: ballY, vx: ballVX, vy: ballVY };
        nextVisionTs = nowMs + VISION_MS;
      }
    }

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
      if (isTournamentMatch) {
        if (isUserP1) {
          playerRoleEl.textContent = `${escapeHTML(p1Name)} (Left Paddle - W/S Keys)`;
          currentPlayerId = 'player1';
        } else if (isUserP2) {
          playerRoleEl.textContent = `${escapeHTML(p2Name)} (Right Paddle - Arrow Keys)`;
          currentPlayerId = 'player2';
        } else if (isP1Bot || isP2Bot) {
          // User is playing against AI
          if (isP1Bot && !isP2Bot) {
            playerRoleEl.textContent = `${escapeHTML(p2Name)} (Right Paddle - Arrow Keys) vs AI`;
            currentPlayerId = 'player2';
          } else if (isP2Bot && !isP1Bot) {
            playerRoleEl.textContent = `${escapeHTML(p1Name)} (Left Paddle - W/S Keys) vs AI`;
            currentPlayerId = 'player1';
          }
        } else {
          playerRoleEl.textContent = 'Spectator';
        }
      } else {
        const role = webSocketService.getUserRole();
        if (role === 'player1' && m) {
          playerRoleEl.textContent = `${aliasOf(m.p1)} (Left Paddle - W/S Keys)`;
          currentPlayerId = 'player1';
        } else if (role === 'player2' && m) {
          playerRoleEl.textContent = `${aliasOf(m.p2)} (Right Paddle - Arrow Keys)`;
          currentPlayerId = 'player2';
        }
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

      // Don't process input if paused or game not started
      if (paused || !gameStarted) {
        if (e.key === ' ') paused = !paused;
        return;
      }

      let newPosition: number | null = null;

      // Only allow human player to control their paddle
      if (isTournamentMatch) {
        if ((e.key === 'w' || e.key === 'W') && isUserP1 && !isP1Bot) {
          newPosition = Math.max(0, lY - PADDLE_SPEED * (1/60));
        }
        if ((e.key === 's' || e.key === 'S') && isUserP1 && !isP1Bot) {
          newPosition = Math.min(HEIGHT - PADDLE_H, lY + PADDLE_SPEED * (1/60));
        }
        if (e.key === 'ArrowUp' && isUserP2 && !isP2Bot) {
          newPosition = Math.max(0, rY - PADDLE_SPEED * (1/60));
        }
        if (e.key === 'ArrowDown' && isUserP2 && !isP2Bot) {
          newPosition = Math.min(HEIGHT - PADDLE_H, rY + PADDLE_SPEED * (1/60));
        }
      } else {
        // Non-tournament match (original logic)
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
      }

      if (newPosition !== null && gameConnected) {
        // For tournament matches, specify which player is moving
        if (isTournamentMatch) {
          if (isUserP1) {
            webSocketService.movePaddle(newPosition);
          } else if (isUserP2) {
            webSocketService.movePaddle(newPosition);
          }
        } else {
          webSocketService.movePaddle(newPosition);
        }
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
          step(dt / 1000, now);
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

    function step(dtSec: number, nowMs?: number) {
      // Update AI vision (throttled to 1 Hz)
      if (nowMs !== undefined) {
        updateAIVision(nowMs);
      }

      // Update AI and send paddle movements for bots
      if (isTournamentMatch && gameConnected && gameStarted) {
        // AI for Player 1 (left paddle) - bot controls this paddle
        if (aiP1 && isP1Bot && !isUserP1 && gameConnected) {
          aiP1.update(dtSec, nowMs || Date.now(), lY, sampledBall, scoreL, scoreR);
          const snap = aiP1.getSnapshot();
          const newY = Math.max(0, Math.min(HEIGHT - PADDLE_H, snap.targetY || lY));

          // Only send if position changed significantly
          if (Math.abs(newY - lY) > 1) {
            // Send movement for bot player1
            webSocketService.movePaddle(newY, 'player1');
          }
        }

        // AI for Player 2 (right paddle) - bot controls this paddle
        if (aiP2 && isP2Bot && !isUserP2 && gameConnected) {
          aiP2.update(dtSec, nowMs || Date.now(), rY, sampledBall, scoreL, scoreR);
          const snap = aiP2.getSnapshot();
          const newY = Math.max(0, Math.min(HEIGHT - PADDLE_H, snap.targetY || rY));

          // Only send if position changed significantly
          if (Math.abs(newY - rY) > 1) {
            // Send movement for bot player2
            webSocketService.movePaddle(newY, 'player2');
          }
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

      if (!matchData) return;

      if (isTournamentMatch && 'tournamentId' in matchData && 'dbMatchId' in matchData &&
          matchData.tournamentId != null && matchData.dbMatchId != null) {
        // Tournament match - save to database
        if (scoreL >= SCORE_TO_WIN && 'p1Id' in matchData && matchData.p1Id != null) {
          winnerId = matchData.p1Id;
          winnerMessage = `${matchData.p1 || 'Player 1'} wins!`;
        } else if (scoreR >= SCORE_TO_WIN && 'p2Id' in matchData && matchData.p2Id != null) {
          winnerId = matchData.p2Id;
          winnerMessage = `${matchData.p2 || 'Player 2'} wins!`;
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
        } catch (err: any) {
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

    // Store reference to updateGameFromBackend for WebSocket updates
    updateGameStateRef = updateGameFromBackend;

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
