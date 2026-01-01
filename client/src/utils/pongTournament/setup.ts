import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { i18n } from "../../services/i18n";
import { statsService } from "../../services/stats";
import { createBracketView, createLoginPrompt, createTournamentSetup } from "../../components/pongTournament";
import { generateBots, createBracket } from "./bracketLogic";
import { getActiveTournament, setActiveTournament, resetTournament } from "./tournament";
import { simulateBotMatch } from "./matchLogic";
import { startTournamentMatch } from "./match";
import { tournamentState } from "./state";
import type { TournamentParticipant, LocalTournament } from "../../types/pongTournament";

export function setupTournament() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    showLoginPrompt(root);
    return;
  }

  showTournamentSetup(root);
}

function showLoginPrompt(root: HTMLElement) {
  root.innerHTML = createLoginPrompt();
  
  document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

export function showTournamentSetup(root: HTMLElement) {
  const activeTournament = getActiveTournament();
  
  if (activeTournament && activeTournament.isActive) {
    showTournamentBracket(root);
    return;
  }

  root.innerHTML = createTournamentSetup();

  document.getElementById("btn-4man")?.addEventListener("click", () => startLocalTournament(root, 4));
  document.getElementById("btn-8man")?.addEventListener("click", () => startLocalTournament(root, 8));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

function startLocalTournament(root: HTMLElement, size: 4 | 8) {
  tournamentState.tournamentWinSaved = false;
  tournamentState.tournamentLossSaved = false;

  const player: TournamentParticipant = {
    name: i18n.t('you').toUpperCase(),
    isPlayer: true,
    difficulty: 0
  };

  const bots = generateBots(size - 1);
  const allParticipants = [player, ...bots].sort(() => Math.random() - 0.5);
  const bracket = createBracket(allParticipants);

  const tournament: LocalTournament = {
    size,
    participants: allParticipants,
    bracket,
    currentRound: 0,
    currentMatch: 0,
    isActive: true
  };

  setActiveTournament(tournament);
  showTournamentBracket(root);
}

export function showTournamentBracket(root: HTMLElement) {
  const activeTournament = getActiveTournament();
  
  if (!activeTournament) {
    showTournamentSetup(root);
    return;
  }

  const t = activeTournament;

  let nextMatch: { round: number; match: number } | null = null;

  for (let r = 0; r < t.bracket.length; r++) {
    for (let m = 0; m < t.bracket[r].length; m++) {
      const match = t.bracket[r][m];
      if (match.p1 && match.p2 && !match.winner) {
        nextMatch = { round: r, match: m };
        break;
      }
    }
    if (nextMatch) break;
  }

  const playerInTournament = t.bracket.some(round =>
    round.some(match =>
      (match.p1?.isPlayer || match.p2?.isPlayer) &&
      (!match.winner || match.winner.isPlayer)
    )
  );

  const finalMatch = t.bracket[t.bracket.length - 1][0];
  const tournamentComplete = finalMatch.winner !== null;
  const playerEliminated = !playerInTournament && !tournamentComplete;

  if (playerEliminated && !tournamentState.tournamentLossSaved && isAuthenticated()) {
    tournamentState.tournamentLossSaved = true;
    statsService.saveOfflineMatch({
      playerScore: t.size,
      aiScore: 0,
      result: 'loss',
      difficulty: 'TOURNAMENT',
      gameType: 'tournament'
    }).catch(() => {
      tournamentState.tournamentLossSaved = false;
    });
  }

  root.innerHTML = createBracketView(t, nextMatch, tournamentComplete, playerEliminated);

  root.querySelectorAll('.fifa-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = parseInt((btn as HTMLElement).dataset.round || '0');
      const m = parseInt((btn as HTMLElement).dataset.match || '0');
      const match = t.bracket[r][m];

      if (match.p1?.isPlayer || match.p2?.isPlayer) {
        playTournamentMatch(root, r, m);
      } else {
        simulateBotMatch(r, m, 5);
        showTournamentBracket(root);
      }
    });
  });

  if (tournamentComplete && finalMatch.winner?.isPlayer && !tournamentState.tournamentWinSaved) {
    tournamentState.tournamentWinSaved = true;
    statsService.saveTournamentWin({
      size: t.size,
      rounds: t.bracket.length
    }).then(() => {
      import("../notifications").then(({ showNotification }) => {
        showNotification(i18n.t('tournament_victory_saved'), { type: 'success' });
      });
    }).catch(() => {
      tournamentState.tournamentWinSaved = false;
    });
  }

  document.getElementById("btn-quit-tournament")?.addEventListener("click", () => {
    resetTournament();
    tournamentState.tournamentWinSaved = false;
    tournamentState.tournamentLossSaved = false;
    navigateTo("/home");
  });
}

function playTournamentMatch(root: HTMLElement, roundIndex: number, matchIndex: number) {
  const activeTournament = getActiveTournament();
  if (!activeTournament) return;

  const match = activeTournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;

  const playerIsP1 = match.p1.isPlayer;
  const aiParticipant = playerIsP1 ? match.p2 : match.p1;

  startTournamentMatch(root, roundIndex, matchIndex, aiParticipant.difficulty, aiParticipant.name);
}
