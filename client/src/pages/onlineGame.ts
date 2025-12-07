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
  
    <div class="offlineGame-container" style="background-image: url('${backgroundImage}')">
      <div class="offlineGame-overlay"></div>
      <div class="offlineGame-content">
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
  // For now, let's implement the "Lobby" view if no ID, or "Game" view if ID
  
  if (params && params.id) {
    // Auto-join game if ID is present
    joinGame(root, params.id);
    return;
  }

  // Show Lobby
  root.innerHTML = `
    <div class="offlineGame-start-box" style="min-width: 600px;">
      <h1 class="offlineGame-title">ONLINE LOBBY</h1>
      <p class="offlineGame-subtitle">Join a game or create one</p>

      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-fullwidth" id="btn-create">CREATE GAME</button>
      </div>
      
      <div class="offlineGame-divider"></div>
      
      <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2">ACTIVE GAMES</h3>
      <div id="active-games-list" class="flex flex-col gap-2 max-h-[200px] overflow-y-auto mb-4">
        <p class="text-gray-400 text-sm">Loading...</p>
      </div>

      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary offlineGame-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
  document.getElementById("btn-create")?.addEventListener("click", () => createGame(root));

  loadActiveGames(root);
}

async function loadActiveGames(root: HTMLElement) {
  const list = document.getElementById("active-games-list");
  if (!list) return;

  try {
    const response = await onlineGameService.getActiveGames();
    const games: ActiveGame[] = response.games || [];

    if (games.length === 0) {
      list.innerHTML = '<p class="text-gray-400 text-sm">No active games found.</p>';
      return;
    }

    list.innerHTML = games.map((g: any) => `
      <div class="bg-[#0d1a28] p-3 border-2 border-[#2c6b87] rounded flex justify-between items-center hover:border-[#4a9dc0] transition-all">
        <span class="text-[#e0f7ff] font-['Pixel_Game']">${g.p1} vs ${g.p2}</span>
        <button class="bg-gradient-to-b from-[#3d8aa8] to-[#2c6b87] text-white px-4 py-2 font-['Pixel_Game'] text-sm rounded shadow hover:from-[#4a9dc0] hover:to-[#3d8aa8] transition-all transform hover:scale-105" data-join-id="${g.id}">JOIN</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-join-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.joinId;
        if (id) joinGame(root, id);
      });
    });

  } catch (err) {
    list.innerHTML = '<p class="text-red-400 text-sm">Failed to load games.</p>';
  }
}

function createGame(root: HTMLElement) {
  // Simple create game UI
  // In a real app, we'd ask for opponent name or just create a waiting room
  // For now, let's just create a game against "Waiting..."
  // Or maybe we need a "Create Game" modal?
  // Let's just start the game view and wait for opponent
  
  // Actually, the old client had a "Start Match" button that created a game.
  // Let's simulate that.
  
  const token = getToken();
  onlineGameService.connect(token || undefined);
  
  // We need to know who we are.
  // For now, let's just assume we are Player 1 and we wait for Player 2.
  // The backend requires p1Name and p2Name.
  // We can fetch current user profile first?
  // Let's just use "Player 1" and "Player 2" for now to get it working.
  
  onlineGameService.createGame("Player 1", "Player 2"); // This is a simplification
  
  // Switch to game view
  renderGameView(root);
}

function joinGame(root: HTMLElement, gameId: string) {
  const token = getToken();
  onlineGameService.connect(token || undefined);
  onlineGameService.joinGame(gameId);
  renderGameView(root);
}

function renderGameView(root: HTMLElement) {
  root.innerHTML = `
    <div class="offlineGame-box">
      <div class="offlineGame-scoreboard">
        <div>
          <div class="offlineGame-score-label">P1</div>
          <div class="offlineGame-score-value" id="score-p1">0</div>
        </div>
        <div class="offlineGame-score-divider">:</div>
        <div>
          <div class="offlineGame-score-label">P2</div>
          <div class="offlineGame-score-value" id="score-p2">0</div>
        </div>
      </div>
      <div class="offlineGame-canvas-wrapper">
        <canvas id="online-game-canvas" width="${WIDTH}" height="${HEIGHT}" class="offlineGame-canvas"></canvas>
      </div>
      <div class="offlineGame-controls">
        <button class="offlineGame-btn offlineGame-btn-secondary" id="btn-quit">QUIT</button>
      </div>
      <div id="status-msg" class="text-center text-[#5db3d1] mt-2 font-['Pixel_Game']">Connecting...</div>
    </div>
  `;

  const canvas = document.getElementById("online-game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  
  document.getElementById("btn-quit")?.addEventListener("click", () => {
    onlineGameService.disconnect();
    navigateTo("/home");
  });

  onlineGameService.onGameStateUpdate((state: OnlineGameState) => {
    if (!state) return;

    const statusEl = document.getElementById("status-msg");
    if (statusEl) statusEl.textContent = "";

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
    ctx.save();
    ctx.setLineDash([10, 15]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 10);
    ctx.lineTo(WIDTH / 2, HEIGHT - 10);
    ctx.stroke();
    ctx.restore();

    // Draw Paddles
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(10, state.players[0].paddleY, PADDLE_W, PADDLE_H);
    ctx.fillRect(WIDTH - PADDLE_W - 10, state.players[1].paddleY, PADDLE_W, PADDLE_H);

    // Draw Ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#f2f2ff';
    ctx.fill();
  });

  // Input handling
  const handleKey = (e: KeyboardEvent) => {
    const role = onlineGameService.getUserRole();
    let pos = -1;
    
    const state = onlineGameService.getGameState();
    if (!state) return;
    
    let currentY = 0;
    if (role === 'player1') currentY = state.players[0].paddleY;
    else if (role === 'player2') currentY = state.players[1].paddleY;
    else return; // Spectator

    const speed = 20; // movement speed per key press event (simplified)
    
    if (e.key === 'w' || e.key === 'ArrowUp') {
      pos = Math.max(0, currentY - speed);
    } else if (e.key === 's' || e.key === 'ArrowDown') {
      pos = Math.min(HEIGHT - PADDLE_H, currentY + speed);
    }

    if (pos !== -1) {
      onlineGameService.movePaddle(pos);
    }
  };

  window.addEventListener('keydown', handleKey);
  
  // Cleanup on quit is handled by btn-quit listener which navigates away
  // But we should also remove event listener
  const originalQuit = document.getElementById("btn-quit")?.onclick;
  document.getElementById("btn-quit")!.onclick = (e) => {
    window.removeEventListener('keydown', handleKey);
    if (originalQuit) (originalQuit as any)(e);
  };
}
