import { i18n } from "../../services/i18n";
import type { LocalTournament, TournamentMatchup } from "../../types/pongTournament";

export function createBracketView(tournament: LocalTournament, nextMatch: { round: number; match: number } | null, tournamentComplete: boolean, playerEliminated: boolean): string {
  const t = tournament;
  const roundNames = t.size === 4
    ? [i18n.t('semi_finals'), i18n.t('final')]
    : [i18n.t('quarter_finals'), i18n.t('semi_finals'), i18n.t('final')];

  const finalMatch = t.bracket[t.bracket.length - 1][0];

  const buildMatchCard = (roundIdx: number, matchIdx: number, next: { round: number; match: number } | null) => {
    const match = t.bracket[roundIdx]?.[matchIdx];
    if (!match) return '';

    const isNext = next && next.round === roundIdx && next.match === matchIdx;
    const isPlayerMatch = match.p1?.isPlayer || match.p2?.isPlayer;
    const isDone = match.winner !== null;

    return `
      <div class="fifa-match ${isNext ? 'fifa-match-next' : ''} ${isDone ? 'fifa-match-done' : ''}">
        <div class="fifa-match-players">
          <div class="fifa-player ${match.winner === match.p1 ? 'fifa-player-winner' : ''} ${match.p1?.isPlayer ? 'fifa-player-you' : ''}">
            <span class="fifa-player-name">${match.p1?.name || i18n.t('tbd_short')}</span>
            ${isDone ? `<span class="fifa-player-score">${match.p1Score}</span>` : ''}
          </div>
          <div class="fifa-player ${match.winner === match.p2 ? 'fifa-player-winner' : ''} ${match.p2?.isPlayer ? 'fifa-player-you' : ''}">
            <span class="fifa-player-name">${match.p2?.name || i18n.t('tbd_short')}</span>
            ${isDone ? `<span class="fifa-player-score">${match.p2Score}</span>` : ''}
          </div>
        </div>
        ${isNext && !tournamentComplete ? `
          <button class="fifa-play-btn" data-round="${roundIdx}" data-match="${matchIdx}">
            ${isPlayerMatch ? i18n.t('play') : i18n.t('simulate')}
          </button>
        ` : ''}
      </div>
    `;
  };

  const buildFifaBracket = () => {
    if (t.size === 4) {
      return `
        <div class="fifa-bracket fifa-bracket-4">
          <div class="fifa-round fifa-round-semis">
            <div class="fifa-round-title">${roundNames[0]}</div>
            ${buildMatchCard(0, 0, nextMatch)}
            ${buildMatchCard(0, 1, nextMatch)}
          </div>
          <div class="fifa-connectors">
            <div class="fifa-connector-line"></div>
          </div>
          <div class="fifa-round fifa-round-final">
            <div class="fifa-round-title">${roundNames[1]}</div>
            ${buildMatchCard(1, 0, nextMatch)}
            <div class="fifa-trophy"></div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="fifa-bracket fifa-bracket-8">
          <div class="fifa-round fifa-round-quarters">
            <div class="fifa-round-title">${roundNames[0]}</div>
            ${buildMatchCard(0, 0, nextMatch)}
            ${buildMatchCard(0, 1, nextMatch)}
            ${buildMatchCard(0, 2, nextMatch)}
            ${buildMatchCard(0, 3, nextMatch)}
          </div>
          <div class="fifa-connectors fifa-connectors-8">
            <div class="fifa-connector-group">
              <div class="fifa-connector-line"></div>
            </div>
            <div class="fifa-connector-group">
              <div class="fifa-connector-line"></div>
            </div>
          </div>
          <div class="fifa-round fifa-round-semis">
            <div class="fifa-round-title">${roundNames[1]}</div>
            ${buildMatchCard(1, 0, nextMatch)}
            ${buildMatchCard(1, 1, nextMatch)}
          </div>
          <div class="fifa-connectors">
            <div class="fifa-connector-line"></div>
          </div>
          <div class="fifa-round fifa-round-final">
            <div class="fifa-round-title">${roundNames[2]}</div>
            ${buildMatchCard(2, 0, nextMatch)}
            <div class="fifa-trophy"></div>
          </div>
        </div>
      `;
    }
  };

  return `
    <div class="pong-start-box fifa-tournament-box">
      <h1 class="pong-title">${i18n.t('local_tournament')} - ${t.size} ${i18n.t('players')}</h1>

      ${tournamentComplete ? `
        <div class="fifa-winner-banner">
          <div class="fifa-winner-crown"></div>
          <div class="fifa-winner-name">${finalMatch.winner?.isPlayer ? i18n.t('congratulations') : finalMatch.winner?.name + ' ' + i18n.t('wins_tournament')}</div>
          ${finalMatch.winner?.isPlayer ? `<div class="fifa-winner-subtitle">${i18n.t('you_are_champion')}</div>` : ''}
        </div>
      ` : playerEliminated ? `
        <div class="fifa-eliminated-banner">
          <div class="fifa-eliminated-icon"></div>
          <div class="fifa-eliminated-text">${i18n.t('you_were_eliminated')}</div>
          <div class="fifa-eliminated-hint">${i18n.t('watch_remaining')}</div>
        </div>
      ` : ''}

      ${buildFifaBracket()}

      <div class="pong-controls" style="margin-top: 24px;">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-quit-tournament">
          ${tournamentComplete ? i18n.t('back_to_menu') : i18n.t('quit_tournament')}
        </button>
      </div>
    </div>
  `;
}
