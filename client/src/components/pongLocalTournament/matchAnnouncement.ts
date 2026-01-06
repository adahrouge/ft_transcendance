import { i18n } from "../../services/i18n";
import type { LocalTournamentPlayer } from "../../types/pongLocalTournament";

export function createMatchAnnouncement(
  p1: LocalTournamentPlayer,
  p2: LocalTournamentPlayer,
  roundName: string
): string {
  return `
    <div class="pong-start-box match-announcement-box">
      <h1 class="pong-title">${i18n.t('next_match')}</h1>
      <p class="pong-subtitle">${roundName}</p>

      <div class="match-announcement-players">
        <div class="match-player-card">
          <span class="match-player-name">${p1.name}</span>
        </div>
        <div class="match-vs-divider">
          <span>${i18n.t('vs_text')}</span>
        </div>
        <div class="match-player-card">
          <span class="match-player-name">${p2.name}</span>
        </div>
      </div>

      <div class="match-controls-info">
        <p class="pong-info">${i18n.t('controls_p1')}</p>
        <p class="pong-info">${i18n.t('controls_p2')}</p>
      </div>

      <p class="pong-subtitle get-ready-text">${i18n.t('get_ready')}</p>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-fullwidth" id="btn-start-match">
          ${i18n.t('play')}
        </button>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-quit-announcement">
          ${i18n.t('quit_tournament')}
        </button>
      </div>
    </div>
  `;
}
