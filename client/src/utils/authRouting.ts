// Authentication-based routing logic

import { authAPI } from '../services/api.js';
import { navigate } from '../router.js';

export function handleAuthRedirect() {
  const hasSeenLanding = sessionStorage.getItem('hasSeenLanding');
  const isAuthenticated = authAPI.isAuthenticated();
  const currentPath = location.pathname;

  if (hasSeenLanding && !isAuthenticated && currentPath !== '/auth' && currentPath !== '/') {
    // Seen landing but not logged in - redirect to auth
    navigate('/auth');
  } else if (hasSeenLanding && isAuthenticated && currentPath === '/') {
    // Already logged in and at landing page - redirect to home
    navigate('/home');
  }
}
