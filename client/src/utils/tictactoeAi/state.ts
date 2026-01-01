import type { Board, Player } from "../../types/tictactoe";
import type { XoBoardCustomization } from "../../types/boardCustomization";
import { DEFAULT_XO_CUSTOMIZATION } from "../../types/boardCustomization";

export const AI_DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"];

export let selectedAIDifficulty: number = 50;

export function setAIDifficulty(value: number) {
  selectedAIDifficulty = value;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | 'draw' | null;
  customization: XoBoardCustomization;
}

export function createInitialGameState(customization: XoBoardCustomization = DEFAULT_XO_CUSTOMIZATION): GameState {
  return {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    gameOver: false,
    winner: null,
    customization
  };
}
