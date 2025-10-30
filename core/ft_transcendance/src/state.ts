// src/state.ts
import { normAlias } from './utils.js';

export type Player = { id: string; alias: string };
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

const DEFAULT: Tournament = { players: [], matches: [], currentIndex: 0 };
let state: Tournament = structuredClone(DEFAULT);

// ---- Get/Set/Reset ----
export function getState(): Tournament { return state; }
export function setState(s: Tournament) { state = s; saveState(); }
export function resetTournament() { state = structuredClone(DEFAULT); saveState(); }

// ---- Players ----
export function hasAlias(alias: string): boolean {
  const n = normAlias(alias);
  return state.players.some((p) => normAlias(p.alias) === n);
}

export function addPlayer(alias: string) {
  const trimmed = alias.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Alias cannot be empty');
  if (trimmed.length > 16) throw new Error('Alias must be ≤ 16 chars');
  if (!/^[A-Za-z0-9 _-]+$/.test(trimmed)) throw new Error('Only letters, numbers, space, _ and - are allowed');
  if (hasAlias(trimmed)) throw new Error('Alias already registered');

  const id = crypto.randomUUID();
  state.players.push({ id, alias: trimmed });
  saveState();
}

export function addPlayersBulk(aliases: string[]) {
  // Validate list-level duplicates (case-insensitive)
  const cleaned = aliases.map((a) => a.trim().replace(/\s+/g, ' ')).filter(Boolean);
  const seen = new Set<string>();
  for (const a of cleaned) {
    const key = normAlias(a);
    if (seen.has(key)) throw new Error(`Duplicate in list: "${a}"`);
    seen.add(key);
  }
  // Against existing
  for (const a of cleaned) {
    if (hasAlias(a)) throw new Error(`Already registered: "${a}"`);
  }
  cleaned.forEach(addPlayer);
}

export function removePlayer(id: string) {
  const before = state.players.length;
  state.players = state.players.filter((p) => p.id !== id);
  if (state.players.length !== before) {
    // Remove matches that referenced this player (safe reset)
    state.matches = state.matches.filter((m) => m.p1 !== id && m.p2 !== id);
    state.currentIndex = 0;
    saveState();
  }
}

// ---- Matches ----
function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function generateBracket() {
  state.matches = [];
  state.currentIndex = 0;
  const ps = [...state.players];
  shuffleInPlace(ps);

  for (let i = 0; i < ps.length; i += 2) {
    const p1 = ps[i];
    const p2 = ps[i + 1];
    state.matches.push({
      id: crypto.randomUUID(),
      p1: p1.id,
      p2: p2?.id,
      score1: 0,
      score2: 0,
      status: p2 ? 'pending' : 'finished', // BYE auto-finished
    });
  }
  saveState();
}

export function aliasOf(id?: string): string {
  if (!id) return 'BYE';
  return state.players.find((p) => p.id === id)?.alias || 'Unknown';
}

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

export function setMatchStatus(id: string, status: Match['status']) {
  const m = state.matches.find((m) => m.id === id);
  if (m) { m.status = status; saveState(); }
}

export function nextPendingMatch(): Match | null {
  return state.matches.find((m) => m.status === 'pending') || null;
}
export function pendingQueue(): Match[] {
  return state.matches.filter((m) => m.status === 'pending');
}

// ---- Persistence ----
const KEY = 'ft_tournament_state_v1';
export function saveState() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
export function loadState() { try { const raw = sessionStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch {} }
