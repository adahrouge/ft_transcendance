import { onlineGameService } from "../services/onlineGame";
import { getToken } from "../utils/auth";
import { navigateTo } from "../router";
import { DEFAULT_ONLINE_GAME_CONFIG } from "../types/onlineGame";
import type { OnlineGameState, ActiveGame } from "../types/onlineGame";
import "../styles/onlineGame.css";
import backgroundImage from "../assets/images/background.jpg";

const { width: WIDTH, height: HEIGHT, paddleW: PADDLE_W, paddleH: PADDLE_H, ballR: BALL_R } = DEFAULT_ONLINE_GAME_CONFIG;

export function renderOnlineGamePage(params?: Record<string, string>): string {
  setTimeout(() => {
    setupOnlineGame(params);
  }, 0);

  return `

    <div class="onlineGame-container" style="background-image: url('${backgroundImage}')">
      <div class="onlineGame-overlay"></div>
      <div class="onlineGame-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

async function setupOnlineGame(params?: Record<string, string>) {
  const root = document.getElementById("game-root");
  if (!root) return;

  const token = getToken();
  if (!token) {
    navigateTo("/auth");
    return;
  }

  // If we have an ID, we might be joining a specific game or tournament match
  if (params && params.id) {
    // Auto-join game if ID is present
    joinGame(root, params.id);
    return;
  }

  // Show Mode Selection first
  showModeSelection(root);
}

function showModeSelection(root: HTMLElement) {
  root.innerHTML = `
    <div class="onlineGame-lobby-box" style="min-width: 500px;">
      <h1 class="onlineGame-title">PLAY ONLINE</h1>
      <p class="onlineGame-subtitle">Choose your game mode</p>

      <!-- VS Friend Section -->
      <div class="onlineGame-section">
        <h3 class="onlineGame-section-title">VS FRIEND</h3>
        <p class="onlineGame-section-desc">Challenge a friend to a match</p>
        <div class="onlineGame-controls">
          <button class="onlineGame-btn onlineGame-btn-fullwidth" id="btn-vs-friend">VS FRIEND</button>
        </div>
      </div>

      <div class="onlineGame-divider"></div>

      <!-- Random Match Section -->
      <div class="onlineGame-section">
        <h3 class="onlineGame-section-title">RANDOM MATCH</h3>
        <p class="onlineGame-section-desc">Play against a random opponent</p>
        <div class="onlineGame-controls">
          <button class="onlineGame-btn onlineGame-btn-fullwidth" id="btn-random">RANDOM MATCH</button>
        </div>
      </div>

      <div class="onlineGame-divider"></div>

      <!-- Tournament Section -->
      <div class="onlineGame-section">
        <h3 class="onlineGame-section-title">TOURNAMENT</h3>
        <p class="onlineGame-section-desc">Compete in a tournament bracket</p>
        <div class="onlineGame-controls">
          <button class="onlineGame-btn onlineGame-btn-fullwidth" id="btn-tournament">TOURNAMENT</button>
        </div>
      </div>

      <div class="onlineGame-divider"></div>

      <!-- Back Section -->
      <div class="onlineGame-controls">
        <button class="onlineGame-btn onlineGame-btn-secondary onlineGame-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => navigateTo("/friend"));
  document.getElementById("btn-random")?.addEventListener("click", () => showLobby(root));
  document.getElementById("btn-tournament")?.addEventListener("click", () => navigateTo("/tournament"));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

let lobbyRefreshInterval: ReturnType<typeof setInterval> | null = null;

function clearLobbyRefresh() {
  if (lobbyRefreshInterval) {
    clearInterval(lobbyRefreshInterval);
    lobbyRefreshInterval = null;
  }
}

function showLobby(root: HTMLElement) {
  clearLobbyRefresh();

  root.innerHTML = `
    <div class="onlineGame-lobby-box" style="min-width: 600px;">
      <h1 class="onlineGame-title">ONLINE LOBBY</h1>
      <p class="onlineGame-subtitle">Join a game or create one</p>

      <!-- Create Game Section -->
      <div class="onlineGame-section">
        <h3 class="onlineGame-section-title">CREATE NEW GAME</h3>
        <p class="onlineGame-section-desc">Start a new match and wait for an opponent</p>
        <div class="onlineGame-controls">
          <button class="onlineGame-btn onlineGame-btn-fullwidth" id="btn-create">CREATE GAME</button>
        </div>
      </div>

      <div class="onlineGame-divider"></div>

      <!-- Active Games Section -->
      <div class="onlineGame-section">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="onlineGame-section-title">ACTIVE GAMES</h3>
          <button class="onlineGame-btn onlineGame-btn-secondary" id="btn-refresh" style="padding: 5px 15px; font-size: 12px;">REFRESH</button>
        </div>
        <p class="onlineGame-section-desc">Join an existing match (auto-refreshes every 3s)</p>
        <div id="active-games-list" class="onlineGame-games-list">
          <p class="onlineGame-empty-text">Loading...</p>
        </div>
      </div>

      <div class="onlineGame-divider"></div>

      <!-- Back Section -->
      <div class="onlineGame-controls">
        <button class="onlineGame-btn onlineGame-btn-secondary onlineGame-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-back")?.addEventListener("click", () => {
    clearLobbyRefresh();
    showModeSelection(root);
  });
  document.getElementById("btn-create")?.addEventListener("click", () => {
    clearLobbyRefresh();
    createGame(root);
  });
  document.getElementById("btn-refresh")?.addEventListener("click", () => loadActiveGames(root));

  loadActiveGames(root);

  // Auto-refresh every 3 seconds
  lobbyRefreshInterval = setInterval(() => {
    loadActiveGames(root);
  }, 3000);
}

async function loadActiveGames(root: HTMLElement) {
  const list = document.getElementById("active-games-list");
  if (!list) return;

  try {
    const response = await onlineGameService.getActiveGames();
    const games: ActiveGame[] = response.games || [];

    if (games.length === 0) {
      list.innerHTML = '<p class="onlineGame-empty-text">No active games found.</p>';
      return;
    }

    list.innerHTML = games.map((g: any) => {
      const p1Name = g.players && g.players[0] ? g.players[0].name : "Unknown";
      const p2Name = g.players && g.players[1] ? g.players[1].name : "Waiting...";
      const isWaiting = g.status === 'waiting';
      const joinText = isWaiting ? "PLAY" : "WATCH";
      
      return `
      <div class="onlineGame-game-item">
        <span class="onlineGame-game-name">${p1Name} vs ${p2Name}</span>
        <button class="onlineGame-join-btn" data-join-id="${g.id}">${joinText}</button>
      </div>
    `}).join('');

    list.querySelectorAll('[data-join-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.joinId;
        if (id) joinGame(root, id);
      });
    });

  } catch (err) {
    list.innerHTML = '<p class="onlineGame-error-text">Failed to load games.</p>';
  }
}

function createGame(root: HTMLElement) {
  const token = getToken();
  onlineGameService.connect(token || undefined);
  
  // Create a game waiting for opponent
  onlineGameService.createGame();
  
  // Switch to game view
  renderGameView(root);
}

function joinGame(root: HTMLElement, gameId: string) {
  clearLobbyRefresh();
  const token = getToken();
  onlineGameService.connect(token || undefined);
  onlineGameService.joinGame(gameId);
  renderGameView(root);
}

function renderGameView(root: HTMLElement) {
  root.innerHTML = `
    <div class="onlineGame-box">
      <div class="onlineGame-match-info" id="match-info" style="text-align: center; margin-bottom: 10px;">
        <span style="color: #7dd3fc; font-size: 14px;">Connecting...</span>
      </div>
      <div class="onlineGame-scoreboard">
        <div>
          <div class="onlineGame-score-label" id="p1-name">P1</div>
          <div class="onlineGame-score-value" id="score-p1">0</div>
        </div>
        <div class="onlineGame-score-divider">:</div>
        <div>
          <div class="onlineGame-score-label" id="p2-name">P2</div>
          <div class="onlineGame-score-value" id="score-p2">0</div>
        </div>
      </div>
      <div class="onlineGame-canvas-wrapper">
        <canvas id="online-game-canvas" width="${WIDTH}" height="${HEIGHT}" class="onlineGame-canvas"></canvas>
      </div>
      <div class="onlineGame-controls">
        <button class="onlineGame-btn onlineGame-btn-secondary" id="btn-quit">QUIT</button>
      </div>
      <div id="status-msg" class="onlineGame-status"></div>
      <div id="goal-flash-top" style="display: none; position: absolute; top: 0; left: 0; right: 0; height: 50%; background: radial-gradient(ellipse at center top, rgba(239, 68, 68, 0.6) 0%, transparent 70%); pointer-events: none; z-index: 50;"></div>
      <div id="goal-flash-bottom" style="display: none; position: absolute; bottom: 0; left: 0; right: 0; height: 50%; background: radial-gradient(ellipse at center bottom, rgba(239, 68, 68, 0.6) 0%, transparent 70%); pointer-events: none; z-index: 50;"></div>
      <div id="goal-text" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px; font-weight: bold; color: #fbbf24; text-shadow: 0 0 20px rgba(251, 191, 36, 0.8); z-index: 60; pointer-events: none;"></div>
      <div id="game-over-overlay" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); flex-direction: column; align-items: center; justify-content: center; z-index: 100;">
        <div style="text-align: center; padding: 30px;">
          <h2 id="game-over-title" style="color: #7dd3fc; font-size: 32px; margin-bottom: 10px; font-family: 'Pixel Game', monospace;"></h2>
          <p id="game-over-score" style="color: white; font-size: 48px; margin-bottom: 20px; font-family: 'Pixel Game', monospace;"></p>
          <p id="game-over-message" style="color: #94a3b8; font-size: 14px; margin-bottom: 30px; font-family: 'Pixel Game', monospace;"></p>
          <button id="btn-back-to-lobby" class="onlineGame-btn">BACK TO LOBBY</button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById("online-game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  // Track player names for game end display
  let player1Name = "Player 1";
  let player2Name = "Player 2";
  let currentBorderColor = '#3d8aa8';

  onlineGameService.onGameStateUpdate((state: OnlineGameState) => {
    if (!state) return;

    const statusEl = document.getElementById("status-msg");
    if (statusEl) statusEl.textContent = "";

    // Update player names
    const p1NameEl = document.getElementById("p1-name");
    const p2NameEl = document.getElementById("p2-name");
    player1Name = state.players[0].name || "Player 1";
    player2Name = state.players[1].name || "Player 2";

    // Truncate names if too long
    const maxLen = 10;
    const p1Display = player1Name.length > maxLen ? player1Name.substring(0, maxLen) + "..." : player1Name;
    const p2Display = player2Name.length > maxLen ? player2Name.substring(0, maxLen) + "..." : player2Name;

    if (p1NameEl) p1NameEl.textContent = p1Display;
    if (p2NameEl) p2NameEl.textContent = p2Display;

    // Update match info with role indicator
    const matchInfo = document.getElementById("match-info");
    const role = onlineGameService.getUserRole();
    if (matchInfo && state.status === 'playing') {
      const yourName = role === 'player1' ? player1Name : (role === 'player2' ? player2Name : null);
      const opponentName = role === 'player1' ? player2Name : (role === 'player2' ? player1Name : null);

      if (yourName && opponentName) {
        matchInfo.innerHTML = `<span style="color: #7dd3fc; font-size: 14px;">You (<strong>${yourName}</strong>) vs <strong>${opponentName}</strong></span>`;
      } else {
        matchInfo.innerHTML = `<span style="color: #7dd3fc; font-size: 14px;">Spectating: ${player1Name} vs ${player2Name}</span>`;
      }
    } else if (matchInfo && state.status === 'waiting') {
      matchInfo.innerHTML = `<span style="color: #fbbf24; font-size: 14px;">Waiting for opponent to join...</span>`;
    }

    // Update scores
    const p1Score = document.getElementById("score-p1");
    const p2Score = document.getElementById("score-p2");
    if (p1Score) p1Score.textContent = String(state.players[0].score);
    if (p2Score) p2Score.textContent = String(state.players[1].score);

    // Draw
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw Table
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (state.status === 'waiting') {
      ctx.fillStyle = "white";
      ctx.font = "24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for opponent...", WIDTH / 2, HEIGHT / 2);
      return;
    }

    // Draw center line (horizontal for vertical game)
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#2c6b87';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, HEIGHT / 2);
    ctx.lineTo(WIDTH - 10, HEIGHT / 2);
    ctx.stroke();
    ctx.restore();

    // Draw border
    ctx.strokeStyle = currentBorderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);

    // Draw Paddles - VERTICAL ORIENTATION
    // Player 1 at TOP, Player 2 at BOTTOM
    const paddleOffset = 10;
    ctx.fillStyle = '#e0f7ff';
    // Player 1 paddle (TOP)
    ctx.fillRect(state.players[0].paddleX, paddleOffset, PADDLE_W, PADDLE_H);
    // Player 2 paddle (BOTTOM)
    ctx.fillRect(state.players[1].paddleX, HEIGHT - paddleOffset - PADDLE_H, PADDLE_W, PADDLE_H);

    // Draw Ball (square for retro look)
    ctx.fillStyle = '#e0f7ff';
    ctx.fillRect(state.ball.x - BALL_R, state.ball.y - BALL_R, BALL_R * 2, BALL_R * 2);
  });

  // Handle goal scored - show flash animation
  onlineGameService.onGoalScored((scorer, _conceder) => {
    const myRole = onlineGameService.getUserRole();
    
    // Determine border color based on who scored
    // If I am the scorer -> Green
    // If I am the conceder -> Red
    // If I am a spectator -> just show who scored (maybe yellow?)
    
    if (myRole === 'spectator') {
      currentBorderColor = '#fbbf24'; // Yellow for spectators
    } else if (myRole === scorer) {
      currentBorderColor = '#4ade80'; // Green (I scored)
    } else {
      currentBorderColor = '#f87171'; // Red (I conceded)
    }

    // Reset border color after delay (2.5s)
    setTimeout(() => {
      currentBorderColor = '#3d8aa8';
    }, 2500);
  });

  // Continuous input handling - like offline game
  const keys = { left: false, right: false };
  const PADDLE_SPEED = 400; // pixels per second
  let lastInputTime = performance.now();
  let inputLoopId: number | null = null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      e.preventDefault();
      keys.left = true;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      e.preventDefault();
      keys.right = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      keys.left = false;
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      keys.right = false;
    }
  };

  // Input loop - runs continuously to send smooth paddle updates
  const inputLoop = () => {
    const now = performance.now();
    const dt = (now - lastInputTime) / 1000; // delta time in seconds
    lastInputTime = now;

    const role = onlineGameService.getUserRole();
    if (role === 'spectator') {
      inputLoopId = requestAnimationFrame(inputLoop);
      return;
    }

    const state = onlineGameService.getGameState();
    if (!state || state.status !== 'playing') {
      inputLoopId = requestAnimationFrame(inputLoop);
      return;
    }

    let currentX = role === 'player1' ? state.players[0].paddleX : state.players[1].paddleX;
    let newX = currentX;

    if (keys.left) {
      newX = Math.max(0, currentX - PADDLE_SPEED * dt);
    }
    if (keys.right) {
      newX = Math.min(WIDTH - PADDLE_W, currentX + PADDLE_SPEED * dt);
    }

    // Only send update if position changed
    if (newX !== currentX) {
      onlineGameService.movePaddle(newX);
    }

    inputLoopId = requestAnimationFrame(inputLoop);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Start input loop
  lastInputTime = performance.now();
  inputLoopId = requestAnimationFrame(inputLoop);

  const cleanup = () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (inputLoopId !== null) {
      cancelAnimationFrame(inputLoopId);
      inputLoopId = null;
    }
  };

  // Helper to show game over overlay
  const showGameOverOverlay = (title: string, score: string, message: string, titleColor: string = "#7dd3fc") => {
    const overlay = document.getElementById("game-over-overlay");
    const titleEl = document.getElementById("game-over-title");
    const scoreEl = document.getElementById("game-over-score");
    const messageEl = document.getElementById("game-over-message");

    if (overlay) {
      overlay.style.display = "flex";
      // Allow clicking anywhere to continue
      overlay.style.cursor = "pointer";
      overlay.onclick = () => {
        onlineGameService.disconnect();
        const root = document.getElementById("game-root");
        if (root) {
          showModeSelection(root);
          // Update URL to remove game ID if present, without reloading
          window.history.pushState({}, "", "/online-game");
        } else {
          navigateTo("/online-game");
        }
      };
    }
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.color = titleColor;
    }
    if (scoreEl) scoreEl.textContent = score;
    if (messageEl) {
      messageEl.textContent = message;
      // Add hint to click anywhere
      messageEl.innerHTML += "<br><br><span style='font-size: 12px; opacity: 0.7;'>(Click anywhere to continue)</span>";
    }
  };

  // Handle game end (opponent left or game finished)
  onlineGameService.onGameEnd((reason, _message) => {
    cleanup();

    const state = onlineGameService.getGameState();
    const role = onlineGameService.getUserRole();

    if (reason === "player_left") {
      // Opponent disconnected
      showGameOverOverlay(
        "CONNECTION LOST",
        state ? `${state.players[0].score} - ${state.players[1].score}` : "",
        "The connection to the opponent was lost.",
        "#94a3b8"  // Gray/Neutral color
      );
    } else if (reason === "game_ended" && state) {
      // Game finished normally - determine winner
      const p1Score = state.players[0].score;
      const p2Score = state.players[1].score;
      const p1Won = p1Score > p2Score;

      let title = "";
      let titleColor = "#7dd3fc";
      let resultMessage = "";

      if (role === "player1") {
        if (p1Won) {
          title = "YOU WIN!";
          titleColor = "#4ade80";  // Green
          resultMessage = `Congratulations! You defeated ${player2Name}.`;
        } else {
          title = "YOU LOSE";
          titleColor = "#f87171";  // Red
          resultMessage = `${player2Name} has won the match.`;
        }
      } else if (role === "player2") {
        if (!p1Won) {
          title = "YOU WIN!";
          titleColor = "#4ade80";  // Green
          resultMessage = `Congratulations! You defeated ${player1Name}.`;
        } else {
          title = "YOU LOSE";
          titleColor = "#f87171";  // Red
          resultMessage = `${player1Name} has won the match.`;
        }
      } else {
        // Spectator
        const winnerName = p1Won ? player1Name : player2Name;
        title = "GAME OVER";
        resultMessage = `${winnerName} wins the match!`;
      }

      showGameOverOverlay(title, `${p1Score} - ${p2Score}`, resultMessage, titleColor);
    } else {
      // Generic game end
      showGameOverOverlay("GAME ENDED", "", "The game has ended.", "#7dd3fc");
    }

    // Add click listener for back to lobby button
    const backBtn = document.getElementById("btn-back-to-lobby");
    if (backBtn) {
      backBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent bubbling to overlay click
        onlineGameService.disconnect();
        const root = document.getElementById("game-root");
        if (root) {
          showModeSelection(root);
          window.history.pushState({}, "", "/online-game");
        } else {
          navigateTo("/online-game");
        }
      };
    }
  });

  // Cleanup on quit
  const quitBtn = document.getElementById("btn-quit");
  if (quitBtn) {
    quitBtn.onclick = () => {
      cleanup();
      onlineGameService.disconnect();
      navigateTo("/home");
    };
  }
}
