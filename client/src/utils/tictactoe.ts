import { Board, Player, AIConfig } from "../types/tictactoe";

export function checkWinner(board: Board): Player | 'draw' | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  // Check if draw is inevitable (all lines blocked)
  const isDraw = lines.every(([a, b, c]) => {
    const cellA = board[a];
    const cellB = board[b];
    const cellC = board[c];
    const hasX = cellA === 'X' || cellB === 'X' || cellC === 'X';
    const hasO = cellA === 'O' || cellB === 'O' || cellC === 'O';
    return hasX && hasO;
  });

  if (isDraw) {
    return 'draw';
  }

  return null;
}

export function getAvailableMoves(board: Board): number[] {
  return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
}

export function minimax(board: Board, depth: number, isMaximizing: boolean, alpha: number, beta: number, aiPlayer: Player): number {
  const winner = checkWinner(board);
  if (winner === aiPlayer) return 10 - depth;
  if (winner === 'draw') return 0;
  if (winner && winner !== aiPlayer) return depth - 10;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of getAvailableMoves(board)) {
      board[move] = aiPlayer;
      const evalScore = minimax(board, depth + 1, false, alpha, beta, aiPlayer);
      board[move] = null;
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    const opponent = aiPlayer === 'X' ? 'O' : 'X';
    for (const move of getAvailableMoves(board)) {
      board[move] = opponent;
      const evalScore = minimax(board, depth + 1, true, alpha, beta, aiPlayer);
      board[move] = null;
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(board: Board, aiPlayer: Player, config: AIConfig): number {
  // Randomness check
  if (Math.random() < config.randomness) {
    const moves = getAvailableMoves(board);
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestScore = -Infinity;
  let bestMove = -1;
  const moves = getAvailableMoves(board);

  // If first move and center is available, take it (optimization)
  if (moves.length >= 8 && board[4] === null) {
      return 4;
  }

  for (const move of moves) {
    board[move] = aiPlayer;
    const score = minimax(board, 0, false, -Infinity, Infinity, aiPlayer);
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function getAIConfigFromDifficulty(difficulty: number): AIConfig {
  // difficulty 0-100
  // Easy: High randomness
  // Hard: 0 randomness
  
  const t = difficulty / 100;
  
  return {
    depth: 9, 
    randomness: 0.4 * (1 - t) // 40% random at easy, 0% at hard
  };
}
