// src/views/home.ts
import { navigate } from '../router.js';
import { getCurrentUser } from '../utils/user.js';
import { escapeHTML } from '../utils/utils.js';
import { LandingView } from './LandingPage.js';
import { AuthView } from './AuthPage.js';

// Track if user has seen the landing screen in this session
let hasSeenLanding = false;

export const HomeView = () => {
  const wrap = document.createElement('div');
  const user = getCurrentUser();

  if (!user) {
    // Show landing animation first, then auth form
    if (!hasSeenLanding) {
      hasSeenLanding = true;

      // Create landing view
      const landingView = LandingView();
      wrap.appendChild(landingView);

      // Listen for landing completion
      const handleLandingComplete = () => {
        // Remove landing view
        landingView.remove();

        // Show auth view
        const authView = AuthView();
        wrap.appendChild(authView);

        // Remove event listener
        window.removeEventListener('landing-complete', handleLandingComplete);
      };

      window.addEventListener('landing-complete', handleLandingComplete);
    } else {
      // If already seen landing, go straight to auth
      const authView = AuthView();
      wrap.appendChild(authView);
    }

    return wrap;
  }
  
  wrap.innerHTML = `
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <h2 class="text-xl font-semibold tracking-wide mb-1">Welcome back, ${escapeHTML(user.display_name || user.username)}!</h2>
      <p class="text-gray-400 text-sm">Ready to play? Start a tournament, play with a friend, or practice vs AI.</p>
      <div class="flex items-start gap-5 mt-4 flex-wrap">
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="start-tournament">Start Tournament</button>
        <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" href="/friend" data-link>Play vs Friend</a>
        <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" href="/ai" data-link id="play-ai">Play vs AI</a>
      </div>
    </div>
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <h3 class="text-base mt-2.5 mb-1.5 font-semibold">How to play</h3>
      <ul class="list-none">
        <li>Start a tournament to create matches with other players.</li>
        <li>Play vs Friend to challenge a friend to a match.</li>
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
