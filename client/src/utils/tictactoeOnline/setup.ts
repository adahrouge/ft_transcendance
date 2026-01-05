import { navigateTo } from "../../router";
import { checkWinner } from "../tictactoe";
import { xoBoardCustomizationService } from "../../services/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../../types/boardCustomization";
import { i18n } from "../../services/i18n";
import { tictactoeMatchmakingService, type OnlineGameState } from "../../services/tictactoeMatchmaking";
import type { Player } from "../../types/tictactoe";
import type { XoBoardCustomization } from "../../types/boardCustomization";
import { drawBoard, getClickedCell, saveOnlineGameStats } from "./gameActions";
import {
  createFindGame,
  createOnlineGameCanvas,
  createOnlineGameOverScreen
} from "../../components/tictactoeOnline";

let currentGameState: OnlineGameState | null = null;

export function setupTicTacToeOnline() {
  const root = document.getElementById("game-root");
  if (!root) return;

  showFindGame(root);
}

async function showFindGame(root: HTMLElement) {
  let queueCount = 0;
  let inQueue = false;
  let searching = false;

  root.innerHTML = createFindGame();

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

  tictactoeMatchmakingService.clearListeners();

  tictactoeMatchmakingService.onQueueUpdate((count) => {
    queueCount = count;
    updateQueueUI();
  });

  tictactoeMatchmakingService.onJoinedQueue(() => {
    inQueue = true;
    searching = true;
    updateQueueUI();
  });

  tictactoeMatchmakingService.onLeftQueue(() => {
    inQueue = false;
    searching = false;
    updateQueueUI();
  });

  tictactoeMatchmakingService.onGameStart((state) => {
    currentGameState = state;
    startOnlineMatch(root);
  });

  tictactoeMatchmakingService.onError((msg) => {
    console.error('Matchmaking error:', msg);
  });

  try {
    await tictactoeMatchmakingService.connect();
  } catch (err) {
    console.error('Failed to connect:', err);
  }

  joinQueueBtn?.addEventListener("click", () => {
    if (!tictactoeMatchmakingService.isConnected()) return;

    if (inQueue) {
      tictactoeMatchmakingService.leaveQueue();
    } else {
      tictactoeMatchmakingService.joinQueue();
    }
  });

  document.getElementById("btn-back")?.addEventListener("click", () => {
    tictactoeMatchmakingService.disconnect();
    navigateTo("/tictactoe");
  });
}

async function startOnlineMatch(root: HTMLElement) {
  if (!currentGameState) {
    navigateTo("/tictactoe");
    return;
  }

  let customization: XoBoardCustomization = DEFAULT_XO_CUSTOMIZATION;
  try {
    customization = await xoBoardCustomizationService.loadCustomization();
  } catch {
    // Use default
  }

  const mySymbol = currentGameState.mySymbol;
  const opponentName = currentGameState.opponent || 'Opponent';

  root.innerHTML = createOnlineGameCanvas(mySymbol, opponentName, currentGameState.isMyTurn, customization);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const statusMe = document.getElementById("status-me");
  const statusOpponent = document.getElementById("status-opponent");

  function updateStatus() {
    if (!currentGameState) return;

    const winner = checkWinner(currentGameState.board);

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
      if (currentGameState.isMyTurn) {
        if (statusMe) statusMe.textContent = i18n.t('your_turn');
        if (statusOpponent) statusOpponent.textContent = '';
      } else {
        if (statusMe) statusMe.textContent = '';
        if (statusOpponent) statusOpponent.textContent = i18n.t('their_turn') || 'THEIR TURN';
      }
    }
  }

  function handleClick(e: MouseEvent) {
    if (!currentGameState || !currentGameState.isMyTurn) return;

    const winner = checkWinner(currentGameState.board);
    if (winner) return;

    const index = getClickedCell(e, canvas);

    if (currentGameState.board[index] === null) {
      tictactoeMatchmakingService.makeMove(index);
    }
  }

  tictactoeMatchmakingService.onGameUpdate((data) => {
    if (currentGameState) {
      currentGameState = {
        ...currentGameState,
        board: data.board,
        currentPlayer: data.currentPlayer,
        isMyTurn: currentGameState.mySymbol === data.currentPlayer
      };
      drawBoard(ctx, canvas, currentGameState.board, customization);
      updateStatus();

      if (data.winner) {
        showOnlineGameOver(root, data.winner, mySymbol);
      }
    }
  });

  tictactoeMatchmakingService.onOpponentDisconnected(() => {
    showOnlineGameOver(root, mySymbol, mySymbol, true);
  });

  document.getElementById("btn-quit")?.addEventListener("click", () => {
    tictactoeMatchmakingService.disconnect();
    navigateTo("/tictactoe");
  });

  canvas.addEventListener("click", handleClick);
  drawBoard(ctx, canvas, currentGameState.board, customization);
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

  await saveOnlineGameStats(result);

  setTimeout(() => {
    root.innerHTML += createOnlineGameOverScreen(title);

    document.getElementById("btn-find-again")?.addEventListener("click", () => {
      tictactoeMatchmakingService.disconnect();
      currentGameState = null;
      showFindGame(root);
    });
    document.getElementById("btn-back-menu")?.addEventListener("click", () => {
      tictactoeMatchmakingService.disconnect();
      currentGameState = null;
      navigateTo("/tictactoe");
    });
  }, 1000);
}
