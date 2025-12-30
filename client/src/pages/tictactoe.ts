import { checkWinner, getAIMove, getAIConfigFromDifficulty } from "../utils/tictactoe";
import { navigateTo } from "../router";
import { isAuthenticated, getToken } from "../utils/auth";
import { i18n } from "../services/i18n";
import { statsService } from "../services/stats";
import { xoBoardCustomizationService } from "../services/boardCustomization";
import type { Board, Player } from "../types/tictactoe";
import type { XoBoardCustomization } from "../types/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../types/boardCustomization";
import "../styles/tictactoe.css";

// Game settings
const AI_DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"];

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 33) return i18n.t('easy');
  if (difficulty <= 66) return i18n.t('medium');
  return i18n.t('hard');
}

type GameMode = "ai" | "friend" | "online";

let selectedAIDifficulty: number = 50;
let selectedGameMode: GameMode = "ai";

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

export function renderTicTacToePage(): string {
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
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
    return;
  }

  showModeSelection(root);
}

function showModeSelection(root: HTMLElement) {
  // Cleanup any existing matchmaking connection
  cleanupMatchmaking();

  root.innerHTML = `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('play_tictactoe_title')}</h1>
      <p class="tictactoe-subtitle">${i18n.t('choose_mode')}</p>

      <div class="tictactoe-mode-buttons">
        <button class="tictactoe-mode-btn" id="btn-vs-ai">
          <span class="tictactoe-mode-title">${i18n.t('vs_ai')}</span>
          <span class="tictactoe-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="tictactoe-mode-btn" id="btn-vs-friend">
          <span class="tictactoe-mode-title">${i18n.t('vs_friend')}</span>
          <span class="tictactoe-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
        <button class="tictactoe-mode-btn" id="btn-find-game">
          <span class="tictactoe-mode-title">${i18n.t('find_game') || 'FIND GAME'}</span>
          <span class="tictactoe-mode-desc">${i18n.t('play_online') || 'Play against another player online'}</span>
        </button>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-vs-ai")?.addEventListener("click", () => {
    selectedGameMode = "ai";
    showMatchSetup(root);
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    selectedGameMode = "friend";
    startMatch(root);
  });

  document.getElementById("btn-find-game")?.addEventListener("click", () => {
    selectedGameMode = "online";
    showFindGame(root);
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

function showMatchSetup(root: HTMLElement) {
  root.innerHTML = `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('play_vs_ai')}</h1>
      
      <div class="tictactoe-settings">
        <div class="tictactoe-setting-row">
          <span class="tictactoe-setting-label">${i18n.t('ai_difficulty')}: <span id="difficulty-label">${getDifficultyLabel(selectedAIDifficulty)}</span></span>
          <div class="tictactoe-slider-container">
            <span class="tictactoe-slider-label">${i18n.t('easy')}</span>
            <input type="range" id="difficulty-slider" class="tictactoe-slider" min="0" max="100" value="${selectedAIDifficulty}">
            <span class="tictactoe-slider-label">${i18n.t('hard')}</span>
          </div>
        </div>
      </div>

      <div class="tictactoe-divider"></div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-start">START MATCH</button>
      </div>
      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  const difficultySlider = document.getElementById("difficulty-slider") as HTMLInputElement;
  const difficultyLabel = document.getElementById("difficulty-label");
  difficultySlider?.addEventListener("input", () => {
    selectedAIDifficulty = parseInt(difficultySlider.value, 10);
    if (difficultyLabel) {
      difficultyLabel.textContent = getDifficultyLabel(selectedAIDifficulty);
    }
  });

  document.getElementById("btn-start")?.addEventListener("click", () => startMatch(root));
  document.getElementById("btn-back")?.addEventListener("click", () => showModeSelection(root));
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
    showModeSelection(root);
  });
}

async function startOnlineMatch(root: HTMLElement) {
  if (!onlineGameState || !matchmakingSocket) {
    showModeSelection(root);
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
    showModeSelection(root);
  });

  canvas.addEventListener("click", handleClick);
  drawBoard();
  updateStatus();
}

function showOnlineGameOver(root: HTMLElement, winner: Player | 'draw', mySymbol: Player, opponentDisconnected = false) {
  let title = '';
  if (opponentDisconnected) {
    title = i18n.t('opponent_disconnected') || 'Opponent disconnected - You win!';
  } else if (winner === 'draw') {
    title = i18n.t('draw');
  } else if (winner === mySymbol) {
    title = i18n.t('you_win') || 'YOU WIN!';
  } else {
    title = i18n.t('you_lose') || 'YOU LOSE!';
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
      showModeSelection(root);
    });
  }, 1000);
}

async function startMatch(root: HTMLElement) {
  const isAI = selectedGameMode === "ai";
  let board: Board = Array(9).fill(null);
  let currentPlayer: Player = 'X';
  let gameOver = false;
  let winner: Player | 'draw' | null = null;

  // Load customization
  let customization: XoBoardCustomization = DEFAULT_XO_CUSTOMIZATION;
  try {
    customization = await xoBoardCustomizationService.loadCustomization();
  } catch {
    // Use default customization
  }

  root.innerHTML = `
    <div class="tictactoe-box">
      <div class="tictactoe-scoreboard">
        <div>
          <div class="tictactoe-score-label">${isAI ? i18n.t('you') : i18n.t('player_x')}</div>
          <div class="tictactoe-score-value" id="status-p1" style="color: #4ade80">YOUR TURN</div>
        </div>
        <div class="tictactoe-score-divider">VS</div>
        <div>
          <div class="tictactoe-score-label">${isAI ? i18n.t('ai') : i18n.t('player_o')}</div>
          <div class="tictactoe-score-value" id="status-p2"></div>
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
  const statusP1 = document.getElementById("status-p1");
  const statusP2 = document.getElementById("status-p2");

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    showModeSelection(root);
  });

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

    // Vertical lines
    ctx.moveTo(canvas.width / 3, 20);
    ctx.lineTo(canvas.width / 3, canvas.height - 20);
    ctx.moveTo(2 * canvas.width / 3, 20);
    ctx.lineTo(2 * canvas.width / 3, canvas.height - 20);

    // Horizontal lines
    ctx.moveTo(20, canvas.height / 3);
    ctx.lineTo(canvas.width - 20, canvas.height / 3);
    ctx.moveTo(20, 2 * canvas.height / 3);
    ctx.lineTo(canvas.width - 20, 2 * canvas.height / 3);

    ctx.stroke();

    // Draw pieces
    board.forEach((cell, i) => {
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

  function updateStatus() {
    if (gameOver) {
      if (winner === 'draw') {
        if (statusP1) statusP1.textContent = i18n.t('draw');
        if (statusP2) statusP2.textContent = i18n.t('draw');
        if (statusP1) statusP1.style.color = "#e0f7ff";
        if (statusP2) statusP2.style.color = "#e0f7ff";
      } else if (winner === 'X') {
        if (statusP1) statusP1.textContent = i18n.t('x_wins');
        if (statusP2) statusP2.textContent = "";
        if (statusP1) statusP1.style.color = customization.colors.xColor;
      } else {
        if (statusP1) statusP1.textContent = "";
        if (statusP2) statusP2.textContent = i18n.t('o_wins');
        if (statusP2) statusP2.style.color = customization.colors.oColor;
      }
    } else {
      if (currentPlayer === 'X') {
        if (statusP1) statusP1.textContent = i18n.t('your_turn');
        if (statusP2) statusP2.textContent = "";
        if (statusP1) statusP1.style.color = customization.colors.xColor;
      } else {
        if (statusP1) statusP1.textContent = "";
        if (statusP2) statusP2.textContent = isAI ? i18n.t('ai_turn') : i18n.t('your_turn');
        if (statusP2) statusP2.style.color = customization.colors.oColor;
      }
    }
  }

  function handleClick(e: MouseEvent) {
    if (gameOver) return;
    if (isAI && currentPlayer === 'O') return; // AI turn

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates if canvas is resized via CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const col = Math.floor((x * scaleX) / (canvas.width / 3));
    const row = Math.floor((y * scaleY) / (canvas.height / 3));
    const index = row * 3 + col;

    if (board[index] === null) {
      makeMove(index);
    }
  }

  function makeMove(index: number) {
    board[index] = currentPlayer;
    drawBoard();
    
    winner = checkWinner(board);
    if (winner) {
      gameOver = true;
      updateStatus();
      endGame();
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if (isAI && currentPlayer === 'O' && !gameOver) {
      setTimeout(makeAIMove, 500);
    }
  }

  function makeAIMove() {
    const config = getAIConfigFromDifficulty(selectedAIDifficulty);
    const move = getAIMove(board, 'O', config);
    if (move !== -1) {
      makeMove(move);
    }
  }

  async function endGame() {
    if (isAI && isAuthenticated()) {
      try {
        // Save stats
        // X is player, O is AI
        // If X wins, player wins. If O wins, AI wins.
        let result = 'draw';
        if (winner === 'X') result = 'win';
        if (winner === 'O') result = 'loss';

        await statsService.saveOfflineMatch({
          playerScore: winner === 'X' ? 1 : 0,
          aiScore: winner === 'O' ? 1 : 0,
          result: result,
          difficulty: AI_DIFFICULTY_LABELS[Math.floor(selectedAIDifficulty / 50)] || 'CUSTOM',
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
            <h1 class="tictactoe-over-title">${winner === 'draw' ? i18n.t('draw') : (winner === 'X' ? i18n.t('x_wins') : i18n.t('o_wins'))}</h1>
            <div class="tictactoe-over-actions">
              <button class="tictactoe-btn" id="btn-rematch">REMATCH</button>
              <button class="tictactoe-btn tictactoe-btn-secondary" id="btn-back-menu">BACK</button>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById("btn-rematch")?.addEventListener("click", () => {
        startMatch(root);
      });
      document.getElementById("btn-back-menu")?.addEventListener("click", () => {
        showModeSelection(root);
      });
    }, 1000);
  }

  canvas.addEventListener("click", handleClick);
  drawBoard();
  updateStatus();
}
