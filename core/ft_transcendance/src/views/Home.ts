import { navigate } from '../router.js';

export const HomeView = () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="card">
      <h2>Welcome to Pong Tournament</h2>
      <p class="muted">Single-Page App in TypeScript · Local 2-player · Deterministic paddle speed · Dockerized with HTTPS.</p>
      <div class="row">
        <button class="btn primary" id="start">Start Tournament</button>
        <a href="/tournament" class="btn" data-link>Open tournament page</a>
      </div>
    </div>
    <div class="card">
      <h3>How to play</h3>
      <ul>
        <li>Two players on the same keyboard.</li>
        <li>Left paddle: W / S · Right paddle: ↑ / ↓.</li>
        <li>First to 5 points wins the match.</li>
      </ul>
    </div>
  `;
  const start = wrap.querySelector('#start') as HTMLButtonElement;
  start.addEventListener('click', () => navigate('/tournament'));
  return wrap;
};
