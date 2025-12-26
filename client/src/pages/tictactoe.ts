import { checkWinner, getAIMove, getAIConfigFromDifficulty } from "../utils/tictactoe";
import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import { statsService } from "../services/stats";
import { xoBoardCustomizationService } from "../services/boardCustomization";
import type { Board, Player } from "../types/tictactoe";
import type { XoBoardCustomization } from "../types/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../types/boardCustomization";
import "../styles/tictactoe.css";
import backgroundImage from "../assets/images/background.jpg";

// Game settings
const AI_DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"];

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 33) return i18n.t('easy');
  if (difficulty <= 66) return i18n.t('medium');
  return i18n.t('hard');
}

type GameMode = "ai" | "friend";

let selectedAIDifficulty: number = 50;
let selectedGameMode: GameMode = "ai";

export function renderTicTacToePage(): string {
  setTimeout(() => {
    setupGame();
  }, 0);

  return `
    <div class="tictactoe-container" style="background-image: url('${backgroundImage}')">
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
