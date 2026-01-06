import type { HumanLocalTournament } from "../../types/pongLocalTournament";

export interface LocalTournamentState {
  globalRaf: number | null;
  activeTournament: HumanLocalTournament | null;
}

export const localTournamentState: LocalTournamentState = {
  globalRaf: null,
  activeTournament: null,
};

export function getActiveLocalTournament(): HumanLocalTournament | null {
  return localTournamentState.activeTournament;
}

export function setActiveLocalTournament(tournament: HumanLocalTournament | null): void {
  localTournamentState.activeTournament = tournament;
}

export function resetLocalTournament(): void {
  localTournamentState.activeTournament = null;
  if (localTournamentState.globalRaf !== null) {
    cancelAnimationFrame(localTournamentState.globalRaf);
    localTournamentState.globalRaf = null;
  }
}
