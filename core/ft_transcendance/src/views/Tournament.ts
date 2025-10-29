// src/views/Tournament.ts

export const TournamentView = () => {
  const s = getState(); // Assuming you're fetching the current state
  const root = document.createElement('div');
  
  // Helper to generate player list
  const playersList = () => `
    <ul>
      ${
        s.players
          .map((p) => `<li>${p.alias} <button class="btn" data-del="${p.id}">Remove</button></li>`)
          .join('') || '<li class="muted">No players yet.</li>'
      }
    </ul>
  `;

  // Tournament matches display
  const matchesList = () => `
    <ol>
      ${
        s.matches
          .map((m) => {
            const label = `${m.p1} vs ${m.p2}`;
            return `<li>${label}</li>`;
          })
          .join('') || '<li class="muted">No matches yet.</li>'
      }
    </ol>
  `;
  
  root.innerHTML = `
    <div class="card">
      <h2>Tournament</h2>
      <div class="row">
        <input type="text" id="alias" placeholder="Enter alias" />
        <button class="btn primary" id="add">Add Player</button>
      </div>
      <h3>Players</h3>
      <div id="players">${playersList()}</div>
      <div class="row">
        <button class="btn" id="generate" ${s.players.length < 2 ? 'disabled' : ''}>Generate Tournament</button>
        <button class="btn" id="reset">Reset Tournament</button>
      </div>
    </div>
    <div class="card">
      <h3>Matches</h3>
      <div id="matches">${matchesList()}</div>
      <div class="row">
        <button class="btn primary" id="next-match" ${s.matches.some(m => m.status === 'pending') ? '' : 'disabled'}>Next Match</button>
      </div>
    </div>
  `;

  // Add player event
  (root.querySelector('#add') as HTMLButtonElement).onclick = () => {
    const alias = (root.querySelector('#alias') as HTMLInputElement).value;
    try {
      addPlayer(alias);
      navigate('/tournament');
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  // Generate tournament event
  (root.querySelector('#generate') as HTMLButtonElement).onclick = () => {
    generateBracket();
    navigate('/tournament');
  };

  // Reset tournament event
  (root.querySelector('#reset') as HTMLButtonElement).onclick = () => {
    if (confirm('Are you sure you want to reset the tournament?')) {
      resetTournament();
      navigate('/tournament');
    }
  };

  // Start the next match
  (root.querySelector('#next-match') as HTMLButtonElement).onclick = () => {
    navigate('/game');
  };

  // Remove player event
  root.querySelectorAll('[data-del]').forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => {
      const id = (btn as HTMLElement).getAttribute('data-del')!;
      removePlayer(id);
      navigate('/tournament');
    };
  });

  return root;
};
