import { initRouter, navigate } from './router.js';
import { loadState, saveState } from './state.js';

// Global error guards – ensure no unhandled errors during browsing
window.addEventListener('error', (e) => {
  console.error('Unhandled error:', (e as ErrorEvent).error || (e as ErrorEvent).message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', (e as PromiseRejectionEvent).reason);
});

// Persist state on unload
window.addEventListener('beforeunload', () => {
  saveState();
});

// Init app
loadState();
initRouter();

// Mark active nav link on route change
function markActive() {
  const path = location.pathname;
  document.querySelectorAll('nav a[data-link]')?.forEach((a) => {
    const el = a as HTMLAnchorElement;
    el.classList.toggle('active', el.getAttribute('href') === path);
  });
}
window.addEventListener('popstate', markActive);
window.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t && t.matches('a[data-link]')) {
    e.preventDefault();
    const href = (t as HTMLAnchorElement).getAttribute('href')!;
    navigate(href);
    markActive();
  }
});
markActive();
