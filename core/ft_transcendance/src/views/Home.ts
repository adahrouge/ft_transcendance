// src/views/home.ts
import { navigate } from '../router.js';

export const HomeView = () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="card">
      <h2>Welcome to Pong</h2>
      <p class="muted">Single-Page App in TypeScript · Local 2-player · AI opponent · Dockerized with HTTPS.</p>
      <div class="row">
        <button class="btn primary" id="local">Play 1v1 (Local)</button>
        <button class="btn" id="ai">Play vs AI</button>
        <a href="/tournament" class="btn" data-link>Open tournament page</a>
      </div>
    </div>
    <div class="card">
      <h3>How to play</h3>
      <ul>
        <li>Two players on the same keyboard.</li>
        <li>Left paddle: W / S · Right paddle: ↑ / ↓ (AI uses these internally).</li>
        <li>First to 5 points wins the match.</li>
      </ul>
    </div>
  `;
  (wrap.querySelector('#local') as HTMLButtonElement).onclick = () => navigate('/local');
  (wrap.querySelector('#ai') as HTMLButtonElement).onclick = () => navigate('/ai');
  return wrap;
};
