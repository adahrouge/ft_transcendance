import { getActiveTournament } from "./tournament";

export function advanceWinner(roundIndex: number, matchIndex: number) {
  const activeTournament = getActiveTournament();
  if (!activeTournament) return;

  const winner = activeTournament.bracket[roundIndex][matchIndex].winner;
  if (!winner) return;

  if (roundIndex + 1 < activeTournament.bracket.length) {
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = activeTournament.bracket[roundIndex + 1][nextMatchIndex];

    if (matchIndex % 2 === 0) {
      nextMatch.p1 = winner;
    } else {
      nextMatch.p2 = winner;
    }
  }
}

export function simulateBotMatch(roundIndex: number, matchIndex: number, scoreToWin: number) {
  const activeTournament = getActiveTournament();
  if (!activeTournament) return;

  const match = activeTournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;

  const difficultyDiff = (match.p1.difficulty - match.p2.difficulty) / 100;
  const p1Advantage = 0.5 + difficultyDiff * 0.3;

  let p1Score = 0;
  let p2Score = 0;

  while (p1Score < scoreToWin && p2Score < scoreToWin) {
    if (Math.random() < p1Advantage) {
      p1Score++;
    } else {
      p2Score++;
    }
  }

  match.p1Score = p1Score;
  match.p2Score = p2Score;
  match.winner = p1Score > p2Score ? match.p1 : match.p2;

  advanceWinner(roundIndex, matchIndex);
}
