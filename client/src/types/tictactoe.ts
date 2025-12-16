export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export type TicTacToeGameState = {
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  gameOver: boolean;
};

export type AIConfig = {
  depth: number;
  randomness: number; // 0-1, chance to make a random move
};
