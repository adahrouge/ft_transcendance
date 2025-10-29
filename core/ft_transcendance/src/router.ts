import { HomeView } from './views/Home.js';
import { TournamentView } from './views/Tournament.js';
import { GameView } from './views/Game.js';

export type View = (params: Record<string, string>) => HTMLElement;

const routes: { pattern: RegExp; keys: string[]; view: View }[] = [
  route('/', HomeView),
  route('/tournament', TournamentView),
  route('/game/:id', GameView),
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

function render() {
  const app = document.getElementById('app')!;
  const m = match(location.pathname);
  const view = m?.view ?? HomeView;
  const params = m?.params ?? {};
  app.innerHTML = '';
  app.appendChild(view(params));
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
