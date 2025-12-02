// src/router.ts
import { HomeView } from './pages/HomePage.js';
import { TournamentView } from './pages/TournamentPage.js';
import { GameView } from './pages/GamePage.js';
import { AIGameView } from './pages/AIPage.js';
import { ProfileView } from './pages/ProfilePage.js';
import { FriendGameView } from './pages/FriendPage.js';

export type View = (params: Record<string, string>) => HTMLElement | Promise<HTMLElement>;

const routes: { pattern: RegExp; keys: string[]; view: View }[] = [
  route('/', HomeView),
  route('/tournament', TournamentView),
  route('/tournament/:id', TournamentView),
  route('/game/:id', GameView),
  route('/ai', AIGameView),
  route('/friend', FriendGameView),
  route('/profile', ProfileView),
];


function route(pattern: string, view: View) {
  const keys: string[] = [];
  const regex = new RegExp(
    '^' +
      pattern
        .replace(/\//g, '\\/')
        .replace(/:([A-Za-z_]+)/g, (_, k) => {
          keys.push(k);
          return '([^/]+)';
        }) +
      '$'
  );
  return { pattern: regex, keys, view };
}

export function initRouter() {
  render();
  window.addEventListener('popstate', render);
}

export function navigate(path: string) {
  history.pushState({}, '', path);
  render();
}

async function render() {
  const app = document.getElementById('app')!;
  const m = match(location.pathname);
  const view = m?.view ?? HomeView;
  const params = m?.params ?? {};
  app.innerHTML = '<div style="text-align:center; padding:40px; color:#ddd;">Loading...</div>';
  const element = await view(params);
  app.innerHTML = '';
  app.appendChild(element);
}

function match(path: string) {
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) {
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { view: r.view, params };
    }
  }
  return null;
}
