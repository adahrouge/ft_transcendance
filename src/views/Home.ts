// src/views/home.ts
import { navigate } from '../router.js';
import { getCurrentUser } from '../user-state.js';
import { escapeHTML } from '../utils.js';

export const HomeView = () => {
  const wrap = document.createElement('div');
  const user = getCurrentUser();
  
  if (!user) {
    wrap.innerHTML = `
      <div class="card">
        <h2>Welcome to Pong Tournament</h2>
        <p class="muted">Please log in or register to play matches and tournaments.</p>
        <div class="row" style="margin-top:16px;">
          <a href="/profile" data-link class="btn primary">Login / Register</a>
        </div>
      </div>
      <div class="card">
        <h3>How to play</h3>
        <ul>
          <li>Register an account to play matches.</li>
          <li>Join tournaments and compete with other players.</li>
          <li>Watch live games as a spectator and chat with other players.</li>
          <li>First to 5 points wins the match.</li>
        </ul>
      </div>
    `;
    return wrap;
  }
  
  wrap.innerHTML = `
    <div class="card">
      <h2>Welcome back, ${escapeHTML(user.display_name || user.username)}!</h2>
      <p class="muted">Ready to play? Start a tournament, play locally 1v1, or practice vs AI.</p>
      <div class="row" style="margin-top:16px;">
        <button class="btn primary" id="start-tournament">Start Tournament</button>
        <a class="btn primary" href="/local" data-link>Play Locally (1v1)</a>
        <a class="btn primary" href="/ai" data-link id="play-ai">Play vs AI</a>
      </div>
    </div>
    <div class="card">
      <h3>How to play</h3>
      <ul>
        <li>Start a tournament to create matches with other players.</li>
        <li>Play locally (1v1) on the same keyboard for quick matches.</li>
        <li>Play vs AI to practice against an AI opponent.</li>
        <li>Join active games as a spectator to watch and chat.</li>
        <li>Left paddle: W / S · Right paddle: ↑ / ↓</li>
        <li>First to 5 points wins the match.</li>
      </ul>
    </div>
  `;


  const startTournamentBtn = wrap.querySelector('#start-tournament') as HTMLButtonElement | null;
  if (startTournamentBtn) {
    startTournamentBtn.onclick = () => navigate('/tournament');
  }

  return wrap;
};
