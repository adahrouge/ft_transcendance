export type Player = { id: string; alias: string };
export type Match = {
  id: string;
  p1: string; // player id
  p2: string; // player id
  score1: number;
  score2: number;
  status: 'pending' | 'playing' | 'finished';
};

export type Tournament = {
  players: Player[];
  matches: Match[];
  currentIndex: number; // index into matches for next match
};

const DEFAULT: Tournament = { players: [], matches: [], currentIndex: 0 };

let state: Tournament = structuredClone(DEFAULT);

// Get state
export function getState(): Tournament {
  return state;
}

// Set state
export function setState(s: Tournament) {
  state = s;
  saveState();
}

// Reset the tournament state
export function resetTournament() {
  state = structuredClone(DEFAULT);
  saveState();
}

// Add a player
export function addPlayer(alias: string) {
  const id = crypto.randomUUID();
  state.players.push({ id, alias });
  saveState();
}

// Remove a player
export function removePlayer(id: string) {
  state.players = state.players.filter((p) => p.id !== id);
  saveState();
}

// Get alias of player by id
export function aliasOf(id: string): string {
  return state.players.find((p) => p.id === id)?.alias || 'Unknown';
}

// Generate the tournament bracket
export function generateBracket() {
  state.matches = [];
  state.currentIndex = 0;
  const ps = [...state.players];
  for (let i = 0; i < ps.length; i += 2) {
    const p1 = ps[i];
    const p2 = ps[i + 1];
    if (!p2) break; // odd: last one gets a bye
    state.matches.push({
      id: crypto.randomUUID(),
      p1: p1.id,
      p2: p2.id,
      score1: 0,
      score2: 0,
      status: 'pending',
    });
  }
  saveState();
}

// Report the match score and set it as finished
export function reportScore(id: string, score1: number, score2: number) {
  const m = state.matches.find((m) => m.id === id);
  if (m) {
    m.score1 = score1;
    m.score2 = score2;
    m.status = 'finished';
    state.currentIndex = Math.min(state.currentIndex + 1, state.matches.length);
    saveState();
  }
}

// Set match status (used to set the status of a match in the tournament)
export function setMatchStatus(id: string, status: Match['status']) {
  const m = state.matches.find((m) => m.id === id);
  if (m) {
    m.status = status;
    saveState();
  }
}

// Save state to sessionStorage
const KEY = 'ft_tournament_state_v1';
export function saveState() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

// Load state from sessionStorage
export function loadState() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
}

// Return next pending match
export function nextPendingMatch(): Match | null {
  const idx = state.matches.findIndex((m) => m.status === 'pending');
  return idx >= 0 ? state.matches[idx] : null;
}
