import { checkWinner } from "../utils/tictactoe";
import { navigateTo } from "../router";
import { isAuthenticated, getToken } from "../utils/auth";
import { i18n } from "../services/i18n";
import { statsService } from "../services/stats";
import { xoBoardCustomizationService } from "../services/boardCustomization";
import type { Board, Player } from "../types/tictactoe";
import type { XoBoardCustomization } from "../types/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../types/boardCustomization";
import "../styles/tictactoe.css";

// WebSocket for online matchmaking
let matchmakingSocket: WebSocket | null = null;
let onlineGameState: {
  gameId: string | null;
  mySymbol: Player | null;
  opponent: string | null;
  board: Board;
  currentPlayer: Player;
  isMyTurn: boolean;
} | null = null;

export function renderTicTacToeOnlinePage(): string {
  setTimeout(() => {
    setupGame();
  }, 0);

  return `
    <div class="tictactoe-container">
      <div class="tictactoe-overlay"></div>
      <div class="tictactoe-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

function setupGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    root.innerHTML = `
      <div class="tictactoe-start-box">
        <h1 class="tictactoe-title">${i18n.t('play_tictactoe_title')}</h1>
        <p class="tictactoe-subtitle">${i18n.t('must_login')}</p>
        <div class="tictactoe-controls">
          <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
        </div>
        <div class="tictactoe-controls">
          <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
        </div>
      </div>
    `;
    document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/tictactoe"));
    return;
  }

  showFindGame(root);
}

function cleanupMatchmaking() {
  if (matchmakingSocket) {
    matchmakingSocket.close();
    matchmakingSocket = null;
  }
  onlineGameState = null;
}

function getWebSocketUrl(): string {
  // Use VITE_API_URL if available, otherwise construct from window.location
  const apiUrl = (import.meta as any).env?.VITE_API_URL || '';

  if (apiUrl) {
    // Convert http(s):// to ws(s)://
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/api/tictactoe/matchmaking`;
  }

  // Fallback: use current host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = '3001';
  return `${protocol}//${host}:${port}/api/tictactoe/matchmaking`;
}

async function showFindGame(root: HTMLElement) {
  let queueCount = 0;
  let inQueue = false;
  let searching = false;

  // Fetch initial queue count via REST API
  async function fetchInitialQueueCount() {
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/tictactoe/queue-count`);
      if (response.ok) {
        const data = await response.json();
        queueCount = data.count || 0;
        updateQueueUI();
      }
    } catch (err) {
      console.error('Failed to fetch queue count:', err);
    }
  }

  root.innerHTML = `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('find_game')}</h1>
      <p class="tictactoe-subtitle">${i18n.t('matchmaking_desc')}</p>

      <div class="tictactoe-queue-info">
        <div class="tictactoe-queue-count">
          <span id="queue-count">-</span>
          <span class="tictactoe-queue-label">${i18n.t('players_waiting')}</span>
        </div>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-join-queue">
          ${i18n.t('join_queue')}
        </button>
      </div>
      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">${i18n.t('back')}</button>
      </div>
    </div>
  `;

  const queueCountEl = document.getElementById("queue-count");
  const joinQueueBtn = document.getElementById("btn-join-queue") as HTMLButtonElement;

  function updateQueueUI() {
    if (queueCountEl) queueCountEl.textContent = String(queueCount);
    if (joinQueueBtn) {
      if (searching) {
        joinQueueBtn.textContent = i18n.t('searching') || 'SEARCHING...';
        joinQueueBtn.disabled = true;
      } else if (inQueue) {
        joinQueueBtn.textContent = i18n.t('leave_queue');
        joinQueueBtn.disabled = false;
      } else {
        joinQueueBtn.textContent = i18n.t('join_queue');
        joinQueueBtn.disabled = false;
      }
    }
  }

  // Fetch initial count immediately
  await fetchInitialQueueCount();

  // Connect to WebSocket
  try {
    matchmakingSocket = new WebSocket(getWebSocketUrl());

    matchmakingSocket.onopen = () => {
      const token = getToken();
      if (token && matchmakingSocket) {
        matchmakingSocket.send(JSON.stringify({ type: 'auth', token }));
      }
    };

    matchmakingSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'authenticated':
            // Successfully authenticated - request current queue count
            if (matchmakingSocket) {
              matchmakingSocket.send(JSON.stringify({ type: 'get_queue_count' }));
            }
            break;

          case 'queue_update':
            queueCount = data.count;
            updateQueueUI();
            break;

          case 'joined_queue':
            inQueue = true;
            searching = true;
            updateQueueUI();
            break;

          case 'left_queue':
            inQueue = false;
            searching = false;
            updateQueueUI();
            break;

          case 'game_start':
            // Match found! Start the online game
            onlineGameState = {
              gameId: data.gameId,
              mySymbol: data.yourSymbol,
              opponent: data.opponent,
              board: data.board,
              currentPlayer: data.currentPlayer,
              isMyTurn: data.yourSymbol === data.currentPlayer
            };
            startOnlineMatch(root);
            break;

          case 'error':
            console.error('Matchmaking error:', data.message);
            break;
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    matchmakingSocket.onclose = () => {
      inQueue = false;
      searching = false;
      updateQueueUI();
    };

    matchmakingSocket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  } catch (err) {
    console.error('Failed to connect:', err);
  }

  joinQueueBtn?.addEventListener("click", () => {
    if (!matchmakingSocket || matchmakingSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    if (inQueue) {
      matchmakingSocket.send(JSON.stringify({ type: 'leave_queue' }));
    } else {
      matchmakingSocket.send(JSON.stringify({ type: 'join_queue' }));
    }
  });

  document.getElementById("btn-back")?.addEventListener("click", () => {
    cleanupMatchmaking();
    navigateTo("/tictactoe");
  });
}

async function startOnlineMatch(root: HTMLElement) {
  if (!onlineGameState || !matchmakingSocket) {
    navigateTo("/tictactoe");
    return;
  }

  let customization: XoBoardCustomization = DEFAULT_XO_CUSTOMIZATION;
  try {
    customization = await xoBoardCustomizationService.loadCustomization();
  } catch {
    // Use default
  }

  const mySymbol = onlineGameState.mySymbol!;
  const opponentName = onlineGameState.opponent || 'Opponent';

  root.innerHTML = `
    <div class="tictactoe-box">
      <div class="tictactoe-scoreboard">
        <div>
          <div class="tictactoe-score-label">${i18n.t('you')} (${mySymbol})</div>
          <div class="tictactoe-score-value" id="status-me" style="color: ${mySymbol === 'X' ? customization.colors.xColor : customization.colors.oColor}">
            ${onlineGameState.isMyTurn ? i18n.t('your_turn') : ''}
          </div>
        </div>
        <div class="tictactoe-score-divider">VS</div>
        <div>
          <div class="tictactoe-score-label">${opponentName} (${mySymbol === 'X' ? 'O' : 'X'})</div>
          <div class="tictactoe-score-value" id="status-opponent" style="color: ${mySymbol === 'X' ? customization.colors.oColor : customization.colors.xColor}">
            ${!onlineGameState.isMyTurn ? i18n.t('their_turn') || 'THEIR TURN' : ''}
          </div>
        </div>
      </div>

      <div class="tictactoe-canvas-wrapper">
        <canvas id="game-canvas" width="400" height="400" class="tictactoe-canvas"></canvas>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary" id="btn-quit">QUIT</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const statusMe = document.getElementById("status-me");
  const statusOpponent = document.getElementById("status-opponent");

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = customization.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = customization.colors.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Draw grid
    ctx.strokeStyle = customization.colors.grid;
    ctx.lineWidth = 4;
    ctx.beginPath();

    ctx.moveTo(canvas.width / 3, 20);
    ctx.lineTo(canvas.width / 3, canvas.height - 20);
    ctx.moveTo(2 * canvas.width / 3, 20);
    ctx.lineTo(2 * canvas.width / 3, canvas.height - 20);

    ctx.moveTo(20, canvas.height / 3);
    ctx.lineTo(canvas.width - 20, canvas.height / 3);
    ctx.moveTo(20, 2 * canvas.height / 3);
    ctx.lineTo(canvas.width - 20, 2 * canvas.height / 3);

    ctx.stroke();

    // Draw pieces
    if (onlineGameState) {
      onlineGameState.board.forEach((cell, i) => {
        if (cell) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const x = col * (canvas.width / 3) + (canvas.width / 6);
          const y = row * (canvas.height / 3) + (canvas.height / 6);
          const size = 40;

          if (cell === 'X') {
            ctx.strokeStyle = customization.colors.xColor;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.moveTo(x + size, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.stroke();
          } else {
            ctx.strokeStyle = customization.colors.oColor;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
    }
  }

  function updateStatus() {
    if (!onlineGameState) return;

    const winner = checkWinner(onlineGameState.board);

    if (winner) {
      if (winner === 'draw') {
        if (statusMe) statusMe.textContent = i18n.t('draw');
        if (statusOpponent) statusOpponent.textContent = i18n.t('draw');
      } else if (winner === mySymbol) {
        if (statusMe) statusMe.textContent = i18n.t('you_win') || 'YOU WIN!';
        if (statusOpponent) statusOpponent.textContent = '';
      } else {
        if (statusMe) statusMe.textContent = '';
        if (statusOpponent) statusOpponent.textContent = i18n.t('they_win') || 'THEY WIN!';
      }
    } else {
      if (onlineGameState.isMyTurn) {
        if (statusMe) statusMe.textContent = i18n.t('your_turn');
        if (statusOpponent) statusOpponent.textContent = '';
      } else {
        if (statusMe) statusMe.textContent = '';
        if (statusOpponent) statusOpponent.textContent = i18n.t('their_turn') || 'THEIR TURN';
      }
    }
  }

  function handleClick(e: MouseEvent) {
    if (!onlineGameState || !onlineGameState.isMyTurn) return;

    const winner = checkWinner(onlineGameState.board);
    if (winner) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const col = Math.floor((x * scaleX) / (canvas.width / 3));
    const row = Math.floor((y * scaleY) / (canvas.height / 3));
    const index = row * 3 + col;

    if (onlineGameState.board[index] === null) {
      // Send move to server
      if (matchmakingSocket && matchmakingSocket.readyState === WebSocket.OPEN) {
        matchmakingSocket.send(JSON.stringify({ type: 'move', index }));
      }
    }
  }

  // Handle messages from server
  if (matchmakingSocket) {
    matchmakingSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'game_update':
            if (onlineGameState) {
              onlineGameState.board = data.board;
              onlineGameState.currentPlayer = data.currentPlayer;
              onlineGameState.isMyTurn = onlineGameState.mySymbol === data.currentPlayer;
              drawBoard();
              updateStatus();

              if (data.winner) {
                showOnlineGameOver(root, data.winner, mySymbol);
              }
            }
            break;

          case 'opponent_disconnected':
            showOnlineGameOver(root, mySymbol, mySymbol, true);
            break;

          case 'error':
            console.error('Game error:', data.message);
            break;
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };
  }

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    cleanupMatchmaking();
    navigateTo("/tictactoe");
  });

  canvas.addEventListener("click", handleClick);
  drawBoard();
  updateStatus();
}

async function showOnlineGameOver(root: HTMLElement, winner: Player | 'draw', mySymbol: Player, opponentDisconnected = false) {
  let title = '';
  let result = 'draw';

  if (opponentDisconnected) {
    title = i18n.t('opponent_disconnected') || 'Opponent disconnected - You win!';
    result = 'win';
  } else if (winner === 'draw') {
    title = i18n.t('draw');
    result = 'draw';
  } else if (winner === mySymbol) {
    title = i18n.t('you_win') || 'YOU WIN!';
    result = 'win';
  } else {
    title = i18n.t('you_lose') || 'YOU LOSE!';
    result = 'loss';
  }

  // Save stats for online match
  if (isAuthenticated()) {
    try {
      await statsService.saveOfflineMatch({
        playerScore: result === 'win' ? 1 : 0,
        aiScore: result === 'loss' ? 1 : 0,
        result: result,
        difficulty: 'ONLINE',
        gameType: 'tictactoe'
      });
    } catch {
      // Failed to save stats
    }
  }

  setTimeout(() => {
    root.innerHTML += `
      <div class="tictactoe-over-overlay">
        <div class="tictactoe-over-box">
          <h1 class="tictactoe-over-title">${title}</h1>
          <div class="tictactoe-over-actions">
            <button class="tictactoe-btn" id="btn-find-again">${i18n.t('find_another') || 'FIND ANOTHER GAME'}</button>
            <button class="tictactoe-btn tictactoe-btn-secondary" id="btn-back-menu">BACK</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-find-again")?.addEventListener("click", () => {
      cleanupMatchmaking();
      showFindGame(root);
    });
    document.getElementById("btn-back-menu")?.addEventListener("click", () => {
      cleanupMatchmaking();
      navigateTo("/tictactoe");
    });
  }, 1000);
}
