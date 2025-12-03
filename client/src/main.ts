// src/main.ts - Application entry point

import { initRouter } from './router.js';
import { loadState, saveState } from './utils/tournament.js';
import { initUserState, subscribeToUser } from './utils/user.js';
import { updateNavbarUser } from './components/Navbar.js';
import { initErrorHandling } from './utils/errorHandler.js';
import { handleAuthRedirect } from './utils/authRouting.js';
import './styles/style.css';

initErrorHandling();
window.addEventListener('beforeunload', saveState);

// Load tournament state
loadState();

// Initialize application
async function initApp() {
  await initUserState();
  subscribeToUser(updateNavbarUser);
  handleAuthRedirect();
  initRouter();
}

initApp();
