export type Player = {
  id: string;
  alias: string
};

export type Match = {
  id: string;
  p1: string;     // player id
  p2?: string;    // undefined => BYE
  score1: number;
  score2: number;
  status: 'pending' | 'playing' | 'finished';
};

export type Tournament = {
  players: Player[];
  matches: Match[];
  currentIndex: number;
};
