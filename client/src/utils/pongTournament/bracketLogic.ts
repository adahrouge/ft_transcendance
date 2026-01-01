import type { TournamentParticipant, TournamentMatchup } from "../../types/pongTournament";

// Bot names for tournament opponents
export const BOT_NAMES = [
  "RoboPong", "ByteBot", "PixelAce", "NeonKnight",
  "CyberPaddle", "GlitchMaster", "LaserLord", "TurboTron"
];

// Generate bot participants for tournament
export function generateBots(count: number): TournamentParticipant[] {
  const bots: TournamentParticipant[] = [];
  const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    bots.push({
      name: shuffledNames[i % shuffledNames.length],
      isPlayer: false,
      difficulty: 30 + Math.random() * 50
    });
  }
  return bots;
}

// Create tournament bracket structure
export function createBracket(participants: TournamentParticipant[]): TournamentMatchup[][] {
  const bracket: TournamentMatchup[][] = [];
  const numRounds = Math.log2(participants.length);

  const firstRound: TournamentMatchup[] = [];
  for (let i = 0; i < participants.length; i += 2) {
    firstRound.push({
      p1: participants[i],
      p2: participants[i + 1],
      winner: null,
      p1Score: 0,
      p2Score: 0
    });
  }
  bracket.push(firstRound);

  let matchCount = firstRound.length / 2;
  for (let r = 1; r < numRounds; r++) {
    const round: TournamentMatchup[] = [];
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
