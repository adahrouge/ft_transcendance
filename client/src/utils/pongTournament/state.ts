export interface TournamentState {
  globalRaf: number | null;
  tournamentWinSaved: boolean;
  tournamentLossSaved: boolean;
}

export const tournamentState: TournamentState = {
  globalRaf: null,
  tournamentWinSaved: false,
  tournamentLossSaved: false,
};
