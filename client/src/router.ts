// src/router.ts
import { HomeView } from './pages/HomePage.js';
import { TournamentView } from './pages/TournamentPage.js';
import { GameView } from './pages/GamePage.js';
import { AIGameView } from './pages/AIPage.js';
import { ProfileView } from './pages/ProfilePage.js';
import { FriendGameView } from './pages/FriendPage.js';
import { LandingView } from './pages/LandingPage.js';
import { AuthView } from './pages/AuthPage.js';

export type View = (params: Record<string, string>) => HTMLElement | Promise<HTMLElement>;

const routes: { pattern: RegExp; keys: string[]; view: View }[] = [
  route('/auth', AuthView),
  route('/home', HomeView),
  route('/tournament', TournamentView),
  route('/tournament/:id', TournamentView),
  route('/game/:id', GameView),
  route('/ai', AIGameView),
  route('/friend', FriendGameView),
  route('/profile', ProfileView),
  route('/', LandingView), // Landing page is the default route
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

function markActiveLinks() {
  const path = location.pathname;
  document.querySelectorAll('nav a[data-link]')?.forEach((a) => {
    const el = a as HTMLAnchorElement;
    el.classList.toggle('active', el.getAttribute('href') === path);
  });
}

function handleLinkClick(e: Event) {
  const target = (e.target as HTMLElement)?.closest?.('a[data-link]') as HTMLAnchorElement | null;
  if (target) {
    e.preventDefault();
    const href = target.getAttribute('href')!;
    navigate(href);
  }
}

export function initRouter() {
  render();
  window.addEventListener('popstate', () => {
    render();
    markActiveLinks();
  });
  window.addEventListener('click', handleLinkClick);
  markActiveLinks();
}

export function navigate(path: string) {
  history.pushState({}, '', path);
  render();
  markActiveLinks();
}

async function render() {
  const app = document.getElementById('app')!;
  const path = location.pathname;

  const m = match(path);
  const view = m?.view ?? HomeView;
  const params = m?.params ?? {};

  // Load new page in background to prevent white flash
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
