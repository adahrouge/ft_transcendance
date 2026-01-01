import { Board, Player, AIConfig } from "../../types/tictactoe";

/**
 * Check if the game has ended and return the result
 * Returns:
 * - 'X' or 'O' if that player won
 * - 'draw' if the board is full with no winner
 * - null if the game is still ongoing
 */
export function checkWinner(board: Board): Player | 'draw' | null {
  // All possible winning lines (rows, columns, diagonals)
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // Check if someone won
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return the winner ('X' or 'O')
    }
  }

  // Check if board is full (no empty cells left)
  const isFull = board.every(cell => cell !== null);
  if (isFull) {
    return 'draw'; // No winner and board is full = draw
  }

  // Game is still ongoing
  return null;
}

export function getAvailableMoves(board: Board): number[] {
  return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
}

/**
 * Check if a player can win in one move on a given line
 * Returns the winning position or -1 if no winning move
 */
function canWinOnLine(board: Board, line: number[], player: Player): number {
  const values = line.map(i => board[i]);
  const playerCount = values.filter(v => v === player).length;
  const emptyCount = values.filter(v => v === null).length;

  // If 2 of our pieces and 1 empty, we can win
  if (playerCount === 2 && emptyCount === 1) {
    const emptyIndex = values.findIndex(v => v === null);
    return line[emptyIndex];
  }

  return -1;
}

/**
 * Find a winning move for the given player
 */
function findWinningMove(board: Board, player: Player): number {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const line of lines) {
    const move = canWinOnLine(board, line, player);
    if (move !== -1) return move;
  }

  return -1;
}

/**
 * Simple, human-like AI that follows basic tic-tac-toe strategy:
 * 1. Win if possible
 * 2. Block opponent from winning
 * 3. Take center if available
 * 4. Take a corner if available
 * 5. Take any side
 */
export function getAIMove(board: Board, aiPlayer: Player, config: AIConfig): number {
  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves = getAvailableMoves(board);

  // For easy/medium difficulty: sometimes make random moves
  if (Math.random() < config.randomness) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Strategy 1: Win if we can
  const winningMove = findWinningMove(board, aiPlayer);
  if (winningMove !== -1) {
    return winningMove;
  }

  // Strategy 2: Block opponent from winning
  const blockingMove = findWinningMove(board, opponent);
  if (blockingMove !== -1) {
    return blockingMove;
  }

  // Strategy 3: Take center if available (position 4)
  if (board[4] === null) {
    return 4;
  }

  // Strategy 4: Take a corner if available (positions 0, 2, 6, 8)
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(pos => board[pos] === null);
  if (availableCorners.length > 0) {
    // Pick a random corner from available ones
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  // Strategy 5: Take any available side (positions 1, 3, 5, 7)
  const sides = [1, 3, 5, 7];
  const availableSides = sides.filter(pos => board[pos] === null);
  if (availableSides.length > 0) {
    return availableSides[Math.floor(Math.random() * availableSides.length)];
  }

  // Fallback: take first available move (should never happen)
  return availableMoves[0];
}

export function getAIConfigFromDifficulty(difficulty: number): AIConfig {
  // difficulty 0-100
  // Easy (0-33): 60% chance of random moves - makes lots of mistakes
  // Medium (34-66): 30% chance of random moves - occasionally makes mistakes
  // Hard (67-100): 0% random moves - always plays optimally

  const t = difficulty / 100;

  let randomness = 0;
  if (difficulty <= 33) {
    randomness = 0.6; // Easy: 60% random
  } else if (difficulty <= 66) {
    randomness = 0.3; // Medium: 30% random
  } else {
    randomness = 0; // Hard: 0% random (perfect play)
  }

  return {
    depth: 9, // Not used anymore, kept for compatibility
    randomness: randomness
  };
}
