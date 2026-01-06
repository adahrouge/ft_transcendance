import { navigateTo } from "../../router";
import { i18n } from "../../services/i18n";
import { 
  createPlayerRegistration, 
  createLocalBracketView,
  createMatchAnnouncement 
} from "../../components/pongLocalTournament";
import { createLocalBracket, shufflePlayers, findNextMatch, isTournamentComplete, getRoundName } from "./bracketLogic";
import { getActiveLocalTournament, setActiveLocalTournament, resetLocalTournament } from "./state";
import { startLocalTournamentMatch } from "./match";
import type { LocalTournamentPlayer, HumanLocalTournament } from "../../types/pongLocalTournament";

let selectedSize: 4 | 8 = 4;

export function setupLocalTournament() {
  const root = document.getElementById("game-root");
  if (!root) return;

  // Check if there's an active tournament
  const activeTournament = getActiveLocalTournament();
  if (activeTournament && activeTournament.isActive) {
    showLocalTournamentBracket(root);
    return;
  }

  showSizeSelection(root);
}

function showSizeSelection(root: HTMLElement) {
  root.innerHTML = `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('local_tournament')}</h1>
      <p class="pong-subtitle">${i18n.t('local_tournament_desc')}</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-4man">
          <span class="pong-mode-title">${i18n.t('tournament_4_players')}</span>
          <span class="pong-mode-desc">2 ${i18n.t('semi_finals').toLowerCase()} + ${i18n.t('final').toLowerCase()}</span>
        </button>
        <button class="pong-mode-btn" id="btn-8man">
          <span class="pong-mode-title">${i18n.t('tournament_8_players')}</span>
          <span class="pong-mode-desc">${i18n.t('quarter_finals').toLowerCase()} + ${i18n.t('semi_finals').toLowerCase()} + ${i18n.t('final').toLowerCase()}</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">${i18n.t('back')}</button>
      </div>
    </div>
  `;

  document.getElementById("btn-4man")?.addEventListener("click", () => {
    selectedSize = 4;
    showPlayerRegistration(root);
  });

  document.getElementById("btn-8man")?.addEventListener("click", () => {
    selectedSize = 8;
    showPlayerRegistration(root);
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/pong"));
}

function showPlayerRegistration(root: HTMLElement) {
  root.innerHTML = createPlayerRegistration(selectedSize);

  document.getElementById("btn-start-tournament")?.addEventListener("click", () => {
    const errorDiv = document.getElementById("registration-error");
    const players = collectPlayerNames(selectedSize);
    
    if (!players) {
      if (errorDiv) errorDiv.textContent = i18n.t('name_too_short');
      return;
    }

    if (hasDuplicateNames(players)) {
      if (errorDiv) errorDiv.textContent = i18n.t('duplicate_names');
      return;
    }

    startLocalTournamentWithPlayers(root, players);
  });

  document.getElementById("btn-back")?.addEventListener("click", () => {
    showSizeSelection(root);
  });
}

function collectPlayerNames(size: number): LocalTournamentPlayer[] | null {
  const players: LocalTournamentPlayer[] = [];
  
  for (let i = 1; i <= size; i++) {
    const input = document.getElementById(`player-name-${i}`) as HTMLInputElement;
    const name = input?.value.trim();
    
    if (!name || name.length < 2) {
      input?.focus();
      return null;
    }
    
    players.push({
      name: name.toUpperCase(),
      id: i
    });
  }
  
  return players;
}

function hasDuplicateNames(players: LocalTournamentPlayer[]): boolean {
  const names = players.map(p => p.name.toLowerCase());
  return new Set(names).size !== names.length;
}

function startLocalTournamentWithPlayers(root: HTMLElement, players: LocalTournamentPlayer[]) {
  // Shuffle players for random matchmaking
  const shuffledPlayers = shufflePlayers(players);
  
  // Create bracket
  const bracket = createLocalBracket(shuffledPlayers);
  
  // Create tournament state
  const tournament: HumanLocalTournament = {
    size: selectedSize,
    players: shuffledPlayers,
    bracket,
    currentRound: 0,
    currentMatch: 0,
    isActive: true
  };
  
  setActiveLocalTournament(tournament);
  showLocalTournamentBracket(root);
}

export function showLocalTournamentBracket(root: HTMLElement) {
  const tournament = getActiveLocalTournament();
  
  if (!tournament) {
    showSizeSelection(root);
    return;
  }

  const nextMatch = findNextMatch(tournament.bracket);
  const tournamentComplete = isTournamentComplete(tournament.bracket);

  root.innerHTML = createLocalBracketView(tournament, nextMatch, tournamentComplete);

  // Setup play buttons
  root.querySelectorAll('.fifa-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = parseInt((btn as HTMLElement).dataset.round || '0');
      const m = parseInt((btn as HTMLElement).dataset.match || '0');
      showMatchAnnouncement(root, r, m);
    });
  });

  // Quit button
  document.getElementById("btn-quit-tournament")?.addEventListener("click", () => {
    resetLocalTournament();
    navigateTo("/pong");
  });
}

function showMatchAnnouncement(root: HTMLElement, roundIndex: number, matchIndex: number) {
  const tournament = getActiveLocalTournament();
  if (!tournament) return;

  const match = tournament.bracket[roundIndex][matchIndex];
  if (!match.p1 || !match.p2) return;

  const totalRounds = tournament.bracket.length;
  const roundName = getRoundName(roundIndex, totalRounds, i18n);

  root.innerHTML = createMatchAnnouncement(match.p1, match.p2, roundName);

  document.getElementById("btn-start-match")?.addEventListener("click", () => {
    startLocalTournamentMatch(root, roundIndex, matchIndex, (updatedRoot) => {
      showLocalTournamentBracket(updatedRoot);
    });
  });

  document.getElementById("btn-quit-announcement")?.addEventListener("click", () => {
    resetLocalTournament();
    navigateTo("/pong");
  });
}
