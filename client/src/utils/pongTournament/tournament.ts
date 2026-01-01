import type { LocalTournament } from "../../types/pongTournament";

export let activeTournament: LocalTournament | null = null;

export function setActiveTournament(tournament: LocalTournament | null) {
  activeTournament = tournament;
}

export function getActiveTournament(): LocalTournament | null {
  return activeTournament;
}

export function resetTournament() {
  activeTournament = null;
}
