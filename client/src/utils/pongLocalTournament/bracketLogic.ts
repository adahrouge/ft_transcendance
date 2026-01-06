import type { LocalTournamentPlayer, LocalTournamentMatchup } from "../../types/pongLocalTournament";

// Shuffle players randomly for fair matchmaking
export function shufflePlayers(players: LocalTournamentPlayer[]): LocalTournamentPlayer[] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create tournament bracket structure for human players
export function createLocalBracket(players: LocalTournamentPlayer[]): LocalTournamentMatchup[][] {
  const bracket: LocalTournamentMatchup[][] = [];
  const numRounds = Math.log2(players.length);

  // First round: pair up all players
  const firstRound: LocalTournamentMatchup[] = [];
  for (let i = 0; i < players.length; i += 2) {
    firstRound.push({
      p1: players[i],
      p2: players[i + 1],
      winner: null,
      p1Score: 0,
      p2Score: 0
    });
  }
  bracket.push(firstRound);

  // Create empty slots for subsequent rounds
  let matchCount = firstRound.length / 2;
  for (let r = 1; r < numRounds; r++) {
    const round: LocalTournamentMatchup[] = [];
    for (let m = 0; m < matchCount; m++) {
      round.push({
        p1: null,
        p2: null,
        winner: null,
        p1Score: 0,
        p2Score: 0
      });
    }
    bracket.push(round);
    matchCount /= 2;
  }

  return bracket;
}

// Advance winner to the next round
export function advanceLocalWinner(
  bracket: LocalTournamentMatchup[][],
  roundIndex: number,
  matchIndex: number
): void {
  const winner = bracket[roundIndex][matchIndex].winner;
  if (!winner) return;

  if (roundIndex + 1 < bracket.length) {
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = bracket[roundIndex + 1][nextMatchIndex];

    if (matchIndex % 2 === 0) {
      nextMatch.p1 = winner;
    } else {
      nextMatch.p2 = winner;
    }
  }
}

// Find the next match that needs to be played
export function findNextMatch(bracket: LocalTournamentMatchup[][]): { round: number; match: number } | null {
  for (let r = 0; r < bracket.length; r++) {
    for (let m = 0; m < bracket[r].length; m++) {
      const match = bracket[r][m];
      if (match.p1 && match.p2 && !match.winner) {
        return { round: r, match: m };
      }
    }
  }
  return null;
}

// Check if tournament is complete
export function isTournamentComplete(bracket: LocalTournamentMatchup[][]): boolean {
  const finalMatch = bracket[bracket.length - 1][0];
  return finalMatch.winner !== null;
}

// Get round name
export function getRoundName(roundIndex: number, totalRounds: number, i18n: any): string {
  if (totalRounds === 2) {
    // 4-player tournament
    return roundIndex === 0 ? i18n.t('semi_finals') : i18n.t('final');
  } else {
    // 8-player tournament
    if (roundIndex === 0) return i18n.t('quarter_finals');
    if (roundIndex === 1) return i18n.t('semi_finals');
    return i18n.t('final');
  }
}
