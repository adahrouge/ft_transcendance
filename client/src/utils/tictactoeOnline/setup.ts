import { navigateTo } from "../../router";
import { isAuthenticated, getToken } from "../auth";
import { checkWinner } from "../tictactoe";
import { xoBoardCustomizationService } from "../../services/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../../types/boardCustomization";
import { i18n } from "../../services/i18n";
import type { Player } from "../../types/tictactoe";
import type { XoBoardCustomization } from "../../types/boardCustomization";
import { 
  matchmakingSocket, 
  onlineGameState, 
  setMatchmakingSocket, 
  setOnlineGameState, 
  cleanupMatchmaking 
} from "./state";
import { getWebSocketUrl, getApiUrl } from "./config";
import { drawBoard, getClickedCell, saveOnlineGameStats } from "./gameActions";
import { 
  createLoginPrompt, 
  createFindGame, 
  createOnlineGameCanvas, 
  createOnlineGameOverScreen 
} from "../../components/tictactoeOnline";

export function setupTicTacToeOnline() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    root.innerHTML = createLoginPrompt();
    document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/tictactoe"));
    return;
  }

  showFindGame(root);
}

async function showFindGame(root: HTMLElement) {
  let queueCount = 0;
  let inQueue = false;
  let searching = false;

  async function fetchInitialQueueCount() {
    try {
      const response = await fetch(`${getApiUrl()}/api/tictactoe/queue-count`);
      if (response.ok) {
        const data = await response.json();
        queueCount = data.count || 0;
        updateQueueUI();
      }
    } catch (err) {
      console.error('Failed to fetch queue count:', err);
    }
  }

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

  await fetchInitialQueueCount();

  try {
    const socket = new WebSocket(getWebSocketUrl());
    setMatchmakingSocket(socket);

    socket.onopen = () => {
      const token = getToken();
      if (token && matchmakingSocket) {
        matchmakingSocket.send(JSON.stringify({ type: 'auth', token }));
      }
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'authenticated':
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
            setOnlineGameState({
              gameId: data.gameId,
              mySymbol: data.yourSymbol,
              opponent: data.opponent,
              board: data.board,
              currentPlayer: data.currentPlayer,
              isMyTurn: data.yourSymbol === data.currentPlayer
            });
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

    socket.onclose = () => {
      inQueue = false;
      searching = false;
      updateQueueUI();
    };

    socket.onerror = (err) => {
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

  root.innerHTML = createOnlineGameCanvas(mySymbol, opponentName, onlineGameState.isMyTurn, customization);

  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const statusMe = document.getElementById("status-me");
  const statusOpponent = document.getElementById("status-opponent");

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

    const index = getClickedCell(e, canvas);

    if (onlineGameState.board[index] === null) {
      if (matchmakingSocket && matchmakingSocket.readyState === WebSocket.OPEN) {
        matchmakingSocket.send(JSON.stringify({ type: 'move', index }));
      }
    }
  }

  if (matchmakingSocket) {
    matchmakingSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'game_update':
            if (onlineGameState) {
              setOnlineGameState({
                ...onlineGameState,
                board: data.board,
                currentPlayer: data.currentPlayer,
                isMyTurn: onlineGameState.mySymbol === data.currentPlayer
              });
              drawBoard(ctx, canvas, onlineGameState.board, customization);
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
  drawBoard(ctx, canvas, onlineGameState.board, customization);
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
      cleanupMatchmaking();
      showFindGame(root);
    });
    document.getElementById("btn-back-menu")?.addEventListener("click", () => {
      cleanupMatchmaking();
      navigateTo("/tictactoe");
    });
  }, 1000);
}
