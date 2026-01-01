import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { checkWinner } from "../tictactoe";
import { xoBoardCustomizationService } from "../../services/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../../types/boardCustomization";
import { i18n } from "../../services/i18n";
import type { Board, Player } from "../../types/tictactoe";
import type { XoBoardCustomization } from "../../types/boardCustomization";
import { selectedAIDifficulty, setAIDifficulty } from "./state";
import { getDifficultyLabel } from "./config";
import { drawBoard, getClickedCell, getAIMoveIndex, saveGameStats } from "./gameActions";
import { createLoginPrompt, createMatchSetup, createGameCanvas, createGameOverScreen } from "../../components/tictactoeAi";

export function setupTicTacToeAi() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    root.innerHTML = createLoginPrompt();
    document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/tictactoe"));
    return;
  }

  showMatchSetup(root);
}

function showMatchSetup(root: HTMLElement) {
  root.innerHTML = createMatchSetup(selectedAIDifficulty);

  const difficultySlider = document.getElementById("difficulty-slider") as HTMLInputElement;
  const difficultyLabel = document.getElementById("difficulty-label");
  
  difficultySlider?.addEventListener("input", () => {
    const value = parseInt(difficultySlider.value, 10);
    setAIDifficulty(value);
    if (difficultyLabel) {
      difficultyLabel.textContent = getDifficultyLabel(value);
    }
  });

  document.getElementById("btn-start")?.addEventListener("click", () => startMatch(root));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/tictactoe"));
}

async function startMatch(root: HTMLElement) {
  let board: Board = Array(9).fill(null);
  let currentPlayer: Player = 'X';
  let gameOver = false;
  let winner: Player | 'draw' | null = null;

  let customization: XoBoardCustomization = DEFAULT_XO_CUSTOMIZATION;
  try {
    customization = await xoBoardCustomizationService.loadCustomization();
  } catch {
    // Use default
  }

  root.innerHTML = createGameCanvas(customization);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const statusP1 = document.getElementById("status-p1");
  const statusP2 = document.getElementById("status-p2");

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    navigateTo("/tictactoe");
  });

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
        if (statusP2) statusP2.textContent = i18n.t('ai_turn');
        if (statusP2) statusP2.style.color = customization.colors.oColor;
      }
    }
  }

  function makeMove(index: number) {
    board[index] = currentPlayer;
    drawBoard(ctx, canvas, board, customization);

    winner = checkWinner(board);
    if (winner) {
      gameOver = true;
      updateStatus();
      endGame();
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if (currentPlayer === 'O' && !gameOver) {
      setTimeout(makeAIMove, 500);
    }
  }

  function makeAIMove() {
    const move = getAIMoveIndex(board);
    if (move !== -1) {
      makeMove(move);
    }
  }

  function handleClick(e: MouseEvent) {
    if (gameOver) return;
    if (currentPlayer === 'O') return;

    const index = getClickedCell(e, canvas);
    if (board[index] === null) {
      makeMove(index);
    }
  }

  async function endGame() {
    await saveGameStats(winner);

    setTimeout(() => {
      root.innerHTML += createGameOverScreen(winner);

      document.getElementById("btn-rematch")?.addEventListener("click", () => {
        startMatch(root);
      });
      document.getElementById("btn-back-menu")?.addEventListener("click", () => {
        navigateTo("/tictactoe");
      });
    }, 1000);
  }

  canvas.addEventListener("click", handleClick);
  drawBoard(ctx, canvas, board, customization);
  updateStatus();
}
