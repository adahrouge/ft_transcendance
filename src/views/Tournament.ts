// src/views/Tournament.ts
import {
  getState,
  addPlayer,
  addPlayersBulk,
  removePlayer,
  generateBracket,
  resetTournament,
  aliasOf,
  nextPendingMatch,
  pendingQueue,
} from '../state.js';
import { navigate } from '../router.js';
import { sanitizeAlias, escapeHTML } from '../utils.js';

export const TournamentView = () => {
  const s = getState();
  const root = document.createElement('div');

  const playersList = () => `
    <ul>
      ${
        s.players.length
          ? s.players
              .map(
                (p) =>
                  `<li>${escapeHTML(p.alias)} <button class="btn" data-del="${p.id}">Remove</button></li>`
              )
              .join('')
          : '<li class="muted">No players yet.</li>'
      }
    </ul>
  `;

  const matchesList = () => `
    <ol>
      ${
        s.matches.length
          ? s.matches
              .map((m, i) => {
                const label = `${i + 1}. ${escapeHTML(aliasOf(m.p1))} vs ${escapeHTML(aliasOf(m.p2))} — ${m.status}`;
                return `<li>${label}</li>`;
              })
              .join('')
          : '<li class="muted">No matches yet.</li>'
      }
    </ol>
  `;

  const next = nextPendingMatch();
  const queue = pendingQueue();

  const nextBlock = () => `
    ${
      next
        ? `<div class="card">
             <h3>Now / Next</h3>
             <p class="matchup"><strong>Next match:</strong> ${escapeHTML(aliasOf(next.p1))} vs ${escapeHTML(aliasOf(next.p2))}</p>
             <div class="row">
               <button class="btn primary" id="play-next">Play Next Match</button>
             </div>
           </div>`
        : '<div class="card"><h3>Now / Next</h3><p class="muted">No pending matches.</p></div>'
    }
  `;

  const queueBlock = () => `
    <div class="card">
      <h3>Matchmaking Order</h3>
      ${
        queue.length
          ? `<ol>${queue
              .map((m) => `<li>${escapeHTML(aliasOf(m.p1))} vs ${escapeHTML(aliasOf(m.p2))}</li>`)
              .join('')}</ol>`
          : '<p class="muted">Empty.</p>'
      }
    </div>
  `;

  root.innerHTML = `
    <div class="card">
      <h2>Tournament Registration</h2>
      <p class="muted">Enter unique aliases (1–16 chars, letters/numbers/space/_/-). Aliases reset when you start a new tournament.</p>
      <div class="row">
        <input class="input-field" id="alias" placeholder="Enter alias" />
        <button class="btn primary" id="add">Add Player</button>
      </div>
      <div class="row">
        <textarea class="input-field" id="bulk" placeholder="Bulk add (one alias per line)" rows="4"></textarea>
        <button class="btn" id="bulk-add">Add All</button>
      </div>
      <h3>Registered Players</h3>
      <div id="players">${playersList()}</div>
      <div class="row">
        <button class="btn" id="generate" ${s.players.length < 2 ? 'disabled' : ''}>Generate Tournament</button>
        <button class="btn" id="reset">New Tournament (Reset)</button>
      </div>
    </div>

    ${nextBlock()}
    ${queueBlock()}

    <div class="card">
      <h3>All Matches</h3>
      <div id="matches">${matchesList()}</div>
    </div>
  `;

  (root.querySelector('#add') as HTMLButtonElement).onclick = () => {
    const input = root.querySelector('#alias') as HTMLInputElement;
    try {
      const alias = sanitizeAlias(input.value);
      addPlayer(alias);
      navigate('/tournament');
    } catch (e: any) {
      alert(e?.message || 'Invalid alias');
    }
  };

  (root.querySelector('#bulk-add') as HTMLButtonElement).onclick = () => {
    const ta = root.querySelector('#bulk') as HTMLTextAreaElement;
    const raw = ta.value || '';
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    try {
      const sanitized = lines.map(sanitizeAlias);
      addPlayersBulk(sanitized);
      navigate('/tournament');
    } catch (e: any) {
      alert(e?.message || 'Failed to add players');
    }
  };

  (root.querySelector('#generate') as HTMLButtonElement).onclick = () => {
    if (s.players.length < 2) { alert('Need at least 2 unique players.'); return; }
    generateBracket();
    navigate('/tournament');
  };

  (root.querySelector('#reset') as HTMLButtonElement).onclick = () => {
    if (confirm('Start a new tournament? All aliases and matches will be cleared.')) {
      resetTournament();
      navigate('/tournament');
    }
  };

  const playBtn = root.querySelector('#play-next') as HTMLButtonElement | null;
  if (playBtn && next) {
    playBtn.onclick = () => { navigate(`/game/${next.id}`); };
  }

  root.querySelectorAll('[data-del]').forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => {
      const id = (btn as HTMLElement).getAttribute('data-del')!;
      removePlayer(id);
      navigate('/tournament');
    };
  });

  return root;
};
