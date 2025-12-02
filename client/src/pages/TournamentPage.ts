// src/views/Tournament.ts
import { navigate } from '../router.js';
import { escapeHTML } from '../utils/utils.js';
import { getCurrentUser } from '../utils/user.js';
import { tournamentAPI, getToken } from '../services/api.js';
import { webSocketService } from '../services/websocket.js';

export const TournamentView = async (params: Record<string, string>) => {
  const user = getCurrentUser();

  // Require authentication
  if (!user) {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
        <h2>Tournament</h2>
        <p class="text-gray-400 text-sm">You must be logged in to access tournaments.</p>
        <div class="flex items-start gap-5 mt-4 flex-wrap">
          <a href="/profile" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70">Login / Register</a>
        </div>
      </div>
    `;
    return root;
  }

  const root = document.createElement('div');

  // If viewing a specific tournament
  if (params.id) {
    return await renderTournamentDetail(root, parseInt(params.id), user);
  }

  // Main tournament list view
  root.innerHTML = `
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <h2>Tournaments</h2>
      <p class="text-gray-400 text-sm">Create a new tournament or join an active one.</p>

      <h3 class="mt-6">Create Tournament</h3>
      <div class="flex items-start gap-5 mt-4 flex-wrap gap-3 mt-3">
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="create-4">Create 4-Player Tournament</button>
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="create-8">Create 8-Player Tournament</button>
      </div>
    </div>

    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 mt-4">
      <h3>Active Tournaments</h3>
      <div id="tournaments-list" class="mt-3">
        <p class="text-gray-400 text-sm">Loading tournaments...</p>
      </div>
    </div>
  `;

  // Create tournament handlers
  (root.querySelector('#create-4') as HTMLButtonElement).onclick = async () => {
    try {
      const result = await tournamentAPI.createTournament(4);
      navigate(`/tournament/${result.tournament.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create tournament');
    }
  };

  (root.querySelector('#create-8') as HTMLButtonElement).onclick = async () => {
    try {
      const result = await tournamentAPI.createTournament(8);
      navigate(`/tournament/${result.tournament.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create tournament');
    }
  };

  // Load active tournaments
  loadActiveTournaments(root);

  // Auto-refresh tournaments list every 3 seconds
  const refreshInterval = setInterval(() => {
    if (document.contains(root)) {
      loadActiveTournaments(root);
    } else {
      clearInterval(refreshInterval);
    }
  }, 3000);

  return root;
}

function setupTournamentChat(root: HTMLElement, tournamentId: number) {
  const chatInput = root.querySelector('#chat-input') as HTMLInputElement | null;
  const chatSend = root.querySelector('#chat-send') as HTMLButtonElement | null;
  const chatMessages = root.querySelector('#chat-messages') as HTMLElement | null;

  if (!chatInput || !chatSend || !chatMessages) {
    console.warn('Chat elements not found, retrying...');
    // Retry after a short delay in case elements aren't ready yet
    setTimeout(() => setupTournamentChat(root, tournamentId), 100);
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    // Disable chat if user is not logged in
    chatInput.disabled = true;
    chatInput.placeholder = 'Login required to chat';
    chatSend.disabled = true;
    return;
  }

  // Ensure chat is always enabled
  chatInput.disabled = false;
  chatSend.disabled = false;
  chatInput.placeholder = 'Type a message...';

  const messages: Array<{username: string, message: string, timestamp: number}> = [];

  // Connect to WebSocket and join tournament chat
  const token = getToken();
  if (!webSocketService['ws'] || webSocketService['ws'].readyState !== WebSocket.OPEN) {
    webSocketService.connect(token || undefined);
    // Wait a bit for connection to establish
    setTimeout(() => {
      webSocketService.joinTournamentChat(tournamentId);
    }, 500);
  } else {
    webSocketService.joinTournamentChat(tournamentId);
  }

  // Subscribe to tournament chat messages
  webSocketService.onTournamentChatMessage((msg: any) => {
    messages.push({
      username: msg.username,
      message: msg.message,
      timestamp: msg.timestamp
    });

    // Keep only last 30 messages
    if (messages.length > 30) {
      messages.shift();
    }

    renderMessages();
  });

  function renderMessages() {
    // Show only last 30 messages
    const displayMessages = messages.slice(-30);

    if (!chatMessages) return;

    if (displayMessages.length === 0) {
      chatMessages.innerHTML = '<div class="text-gray-400 text-xs text-center p-4">No messages yet. Start chatting!</div>';
      return;
    }

    chatMessages.innerHTML = displayMessages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      return `
        <div class="mb-2 p-2 bg-[#222] rounded-md border-l-[3px] border-l-[#5e81f4]">
          <div class="flex justify-between mb-1">
            <strong class="text-[#5e81f4] text-xs">${escapeHTML(msg.username)}</strong>
            <span class="text-[#666] text-[11px]">${time}</span>
          </div>
          <div class="text-[#ddd] text-[13px] break-words leading-[1.4]">${escapeHTML(msg.message)}</div>
        </div>
      `;
    }).join('');

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text || !user) return;

    // Send to server via WebSocket
    webSocketService.sendTournamentChatMessage(text);

    chatInput.value = '';
  }

  chatInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Focus chat input when clicking send button
  chatSend.onclick = () => {
    sendMessage();
    chatInput.focus();
  };

  renderMessages();
}

async function loadActiveTournaments(root: HTMLElement) {
  const listEl = root.querySelector('#tournaments-list');
  if (!listEl) return;

  try {
    const result = await tournamentAPI.getActiveTournaments();
    const tournaments = result.tournaments || [];

    if (tournaments.length === 0) {
      listEl.innerHTML = '<p class="text-gray-400 text-sm">No active tournaments. Create one to get started!</p>';
      return;
    }

    listEl.innerHTML = tournaments.map((t: any) => `
      <div class="p-3 border border-[#444] rounded-lg mb-2 flex justify-between items-center">
        <div>
          <strong>${escapeHTML(t.creator_display_name || t.creator_username)}'s Tournament</strong>
          <div class="text-sm text-gray-400 mt-1">
            ${t.max_players} players • ${t.current_players || 0}/${t.max_players} joined
          </div>
        </div>
        <a href="/tournament/${t.id}" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70">View / Join</a>
      </div>
    `).join('');
  } catch (err: any) {
    listEl.innerHTML = `<p class="text-gray-400 text-sm text-[#f44]">Error loading tournaments: ${err.message}</p>`;
  }
}

async function renderTournamentDetail(root: HTMLElement, tournamentId: number, user: any) {
  try {
    const result = await tournamentAPI.getTournament(tournamentId);
    const tournament = result.tournament;

    if (!tournament) {
      root.innerHTML = `
        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
          <h2>Tournament Not Found</h2>
          <a href="/tournament" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap">Back to Tournaments</a>
        </div>
      `;
      return root;
    }

    const isCreator = tournament.creator_id === user.id;
    const players = tournament.players || [];
    const isJoined = players.some((p: any) => p.user_id === user.id);
    const isFull = players.length >= tournament.max_players;
    const canStart = isCreator && isFull && tournament.status === 'waiting';

    // Render based on tournament status
    if (tournament.status === 'active') {
      return await renderActiveTournament(root, tournament, user);
    }

    // Waiting room view with bracket style
    const showJoinButton = !isJoined && !isFull && players.length < tournament.max_players;
    root.innerHTML = `
      <div class="flex gap-5 items-start">
        <div class="flex-1 min-w-0">
          <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
            <div class="flex justify-between items-center">
              <div>
                <h2>Tournament Lobby</h2>
                <p class="text-gray-400 text-sm">${tournament.max_players}-Player Tournament</p>
              </div>
              <div class="flex gap-2">
                ${isCreator ? `
                  <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap bg-[#dc2626] text-white" id="delete-tournament">Delete</button>
                ` : ''}
                <a href="/tournament" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap">Back</a>
              </div>
            </div>
          </div>

          <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 mt-4">
            <h3 class="mb-4">Tournament Bracket</h3>
            <div id="bracket-container" class="overflow-x-auto overflow-y-hidden w-full">
              ${renderBracketView(players, tournament.max_players)}
            </div>

            ${showJoinButton ? `
              <div class="mt-5 text-center">
                <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="join-tournament">Join Tournament</button>
              </div>
            ` : ''}

            ${isCreator && !isFull ? `
              <div class="mt-5 pt-5 border-t-2 border-t-[#444] text-center">
                <p class="text-gray-400 text-sm mb-3">Waiting for users to join...</p>
                <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px" id="fill-bots">Fill Tournament with bots instead</button>
              </div>
            ` : ''}

            ${canStart ? `
              <div class="mt-5 pt-5 border-t-2 border-t-[#444] text-center">
                <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70 text-base px-6 py-3" id="start-tournament">Start Tournament</button>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="w-[350px] flex-shrink-0">
          <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
            <h3 class="mb-3">Live Chat</h3>
            <div id="chat-messages" class="min-h-[300px] max-h-[500px] overflow-y-auto p-3 bg-[#1a1a1a] rounded-lg mt-3 mb-3">
              <div class="text-gray-400 text-xs text-center p-4">No messages yet. Start chatting!</div>
            </div>
            <div class="flex gap-2">
              <input type="text" id="chat-input" placeholder="Type a message..." class="flex-1 p-2 bg-[#333] border-0 rounded-md text-white text-sm" />
              <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="chat-send">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Join tournament handler
    const joinBtn = root.querySelector('#join-tournament') as HTMLButtonElement | null;
    if (joinBtn) {
      joinBtn.onclick = async () => {
        try {
          await tournamentAPI.joinTournament(tournamentId);
          navigate(`/tournament/${tournamentId}`);
        } catch (err: any) {
          alert(err.message || 'Failed to join tournament');
        }
      };
    }

    // Fill with bots handler
    const fillBotsBtn = root.querySelector('#fill-bots') as HTMLButtonElement | null;
    if (fillBotsBtn) {
      fillBotsBtn.onclick = async () => {
        try {
          fillBotsBtn.disabled = true;
          fillBotsBtn.textContent = 'Filling...';
          await tournamentAPI.fillTournamentWithBots(tournamentId);

          // Refresh the page by navigating to the same route
          // This ensures all data is reloaded and UI is updated
          navigate(`/tournament/${tournamentId}`);
        } catch (err: any) {
          fillBotsBtn.disabled = false;
          fillBotsBtn.textContent = 'Fill Tournament with bots instead';
          const errorMsg = err.message || err.error || 'Failed to fill tournament with bots. Please try again.';
          alert(errorMsg);
          console.error('Fill bots error:', err);
        }
      };
    }

    // Start tournament handler
    const startBtn = root.querySelector('#start-tournament') as HTMLButtonElement | null;
    if (startBtn) {
      startBtn.onclick = async () => {
        try {
          startBtn.disabled = true;
          startBtn.textContent = 'Starting...';
          await tournamentAPI.startTournament(tournamentId);

          // Refresh by navigating to the same route - this will reload with active tournament view
          navigate(`/tournament/${tournamentId}`);
        } catch (err: any) {
          startBtn.disabled = false;
          startBtn.textContent = 'Start Tournament';
          alert(err.message || 'Failed to start tournament');
        }
      };
    }

    // Delete tournament handler
    const deleteBtn = root.querySelector('#delete-tournament') as HTMLButtonElement | null;
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
          return;
        }
        try {
          deleteBtn.disabled = true;
          deleteBtn.textContent = 'Deleting...';
          await tournamentAPI.deleteTournament(tournamentId);
          navigate('/tournament');
        } catch (err: any) {
          deleteBtn.disabled = false;
          deleteBtn.textContent = 'Delete';
          alert(err.message || 'Failed to delete tournament');
        }
      };
    }

    // Setup chat functionality (always available)
    setupTournamentChat(root, tournamentId);

    // Auto-refresh tournament state every 2 seconds
    const refreshInterval = setInterval(async () => {
      if (document.contains(root)) {
        try {
          const result = await tournamentAPI.getTournament(tournamentId);
          const updatedTournament = result.tournament;
          if (updatedTournament.status === 'active') {
            clearInterval(refreshInterval);
            navigate(`/tournament/${tournamentId}`);
          } else {
            const bracketContainer = root.querySelector('#bracket-container');
            if (bracketContainer) {
              bracketContainer.innerHTML = renderBracketView(updatedTournament.players || [], updatedTournament.max_players);
            }
          }
        } catch (err: any) {
          console.error('Error refreshing tournament:', err);
        }
      } else {
        clearInterval(refreshInterval);
      }
    }, 2000);

    return root;
  } catch (err: any) {
    root.innerHTML = `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
        <h2>Error</h2>
        <p class="text-gray-400 text-sm">${escapeHTML(err.message || 'Failed to load tournament')}</p>
        <a href="/tournament" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap mt-4">Back to Tournaments</a>
      </div>
    `;
    return root;
  }
}

// Players list rendering function (currently unused but may be needed for future features)
// @ts-expect-error - Reserved for alternative bracket rendering
function _renderPlayersList(players: any[], maxPlayers: number): string {
  const slots: string[] = [];

  for (let i = 0; i < maxPlayers; i++) {
    const player = players.find((p: any) => p.bracket_position === i);
    if (player) {
      const name = player.is_bot
        ? escapeHTML(player.bot_name || 'AI Bot')
        : escapeHTML(player.display_name || player.username || 'Unknown');
      const badge = player.is_bot ? '<span class="text-[11px] bg-[#555] px-1.5 py-0.5 rounded ml-2">BOT</span>' : '';
      slots.push(`<div class="p-2 bg-[#2a2a2a] rounded-md mb-1.5">${name}${badge}</div>`);
    } else {
      slots.push(`<div class="p-2 bg-[#1a1a1a] rounded-md mb-1.5 text-[#666] border border-dashed border-[#444]">Empty Slot</div>`);
    }
  }

  return slots.join('');
}

function renderBracketView(players: any[], maxPlayers: number): string {
  // Create a professional FIFA World Cup style bracket
  const firstRoundMatches = maxPlayers / 2;

  // Scale down for 8 players to fit in container
  const is8Player = maxPlayers === 8;
  const gapSize = is8Player ? '15px' : '30px';
  const matchGap = is8Player ? '12px' : '24px';
  const semiGap = is8Player ? '50px' : '100px';
  const matchWidth = is8Player ? '200px' : '260px';

  let html = `
    <div style="
      display: flex;
      gap: ${gapSize};
      justify-content: center;
      align-items: center;
      padding: 20px 15px;
      background: linear-gradient(135deg, #0f1419 0%, #1a1a2e 50%, #16213e 100%);
      border-radius: 16px;
      min-height: ${is8Player ? '400px' : '500px'};
      max-width: 100%;
      width: 100%;
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;
      box-sizing: border-box;
    ">
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .bracket-match {
          transition: transform 0.2s ease;
        }
        .bracket-match:hover {
          transform: translateY(-2px);
        }
      </style>
  `;

  // First Round (Quarterfinals for 8 players, Semifinals for 4 players)
  html += `<div style="display:flex; flex-direction:column; gap:${matchGap}; justify-content:space-around; min-width:${matchWidth}; flex-shrink:0;">`;
  for (let i = 0; i < firstRoundMatches; i++) {
    const pos1 = i * 2;
    const pos2 = i * 2 + 1;
    const player1 = players.find((p: any) => p.bracket_position === pos1);
    const player2 = players.find((p: any) => p.bracket_position === pos2);

    html += renderMatchSlot(player1, player2, i + 1, false, false, maxPlayers === 8 ? 'Quarterfinal' : 'Semifinal', is8Player, pos1, pos2, players);
  }
  html += '</div>';

  // Connecting lines and Semi-finals (only for 8 players)
  if (maxPlayers === 8) {
    html += `
      <div style="display:flex; flex-direction:column; gap:${semiGap}; justify-content:center; align-items:center; position:relative; flex-shrink:0;">
        <!-- Vertical connecting lines -->
        <div style="position:absolute; left:0; top:25px; width:20px; height:${is8Player ? '100px' : '200px'}; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="width:2px; height:${is8Player ? '40px' : '80px'}; background:linear-gradient(to bottom, #4a5568, #718096); margin-left:0;"></div>
          <div style="width:2px; height:${is8Player ? '40px' : '80px'}; background:linear-gradient(to bottom, #718096, #4a5568); margin-left:0;"></div>
        </div>
        <!-- Horizontal connecting line -->
        <div style="position:absolute; left:0; top:${is8Player ? '65px' : '130px'}; width:20px; height:2px; background:#718096;"></div>

        <div style="display:flex; flex-direction:column; gap:${semiGap};">
          ${renderMatchSlot(null, null, 0, true, false, 'Semifinal', is8Player, 0, 0, players)}
          ${renderMatchSlot(null, null, 0, true, false, 'Semifinal', is8Player, 0, 0, players)}
        </div>

        <!-- Vertical connecting lines -->
        <div style="position:absolute; right:0; top:25px; width:20px; height:${is8Player ? '100px' : '200px'}; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="width:2px; height:${is8Player ? '40px' : '80px'}; background:linear-gradient(to bottom, #4a5568, #718096); margin-left:${is8Player ? '18px' : '28px'};"></div>
          <div style="width:2px; height:${is8Player ? '40px' : '80px'}; background:linear-gradient(to bottom, #718096, #4a5568); margin-left:${is8Player ? '18px' : '28px'};"></div>
        </div>
        <!-- Horizontal connecting line -->
        <div style="position:absolute; right:0; top:${is8Player ? '65px' : '130px'}; width:20px; height:2px; background:#718096;"></div>
      </div>
    `;
  }

  // Final round with connecting lines
  html += `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; position:relative; min-width:${matchWidth}; flex-shrink:0;">`;

  if (maxPlayers === 8) {
    // Connecting lines from semifinals to final
    html += `
      <div style="position:absolute; left:0; top:0; width:20px; height:${is8Player ? '75px' : '150px'}; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <div style="width:2px; height:${is8Player ? '60px' : '120px'}; background:linear-gradient(to bottom, #4a5568, #fbbf24);"></div>
        <div style="position:absolute; left:0; top:${is8Player ? '30px' : '60px'}; width:20px; height:2px; background:#fbbf24;"></div>
      </div>
    `;
  } else {
    // For 4 players, simpler connection
    html += `
      <div style="position:absolute; left:0; top:0; width:30px; height:80px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <div style="width:2px; height:60px; background:linear-gradient(to bottom, #4a5568, #fbbf24);"></div>
        <div style="position:absolute; left:0; top:30px; width:30px; height:2px; background:#fbbf24;"></div>
      </div>
    `;
  }

  html += renderMatchSlot(null, null, 0, false, true, 'Final', is8Player, 0, 0, players);
  html += '</div>';

  html += '</div>';
  return html;
}

function renderMatchSlot(player1: any, player2: any, matchNum: number, isSemi: boolean = false, isFinal: boolean = false, roundLabel?: string, isCompact: boolean = false, pos1?: number, pos2?: number, playersList?: any[]): string {
  const matchLabel = roundLabel || (isFinal ? 'FINAL' : isSemi ? 'SEMI-FINAL' : `Match ${matchNum}`);
  const slotStyle = isFinal
    ? 'background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border:3px solid #d97706; box-shadow:0 8px 32px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);'
    : 'background:linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border:2px solid #4a5568; box-shadow:0 4px 16px rgba(0, 0, 0, 0.3);';

  // Improved: For null player, check if there is a bot for this position and show AI Bot n
  function positionalBotName(position?: number): string {
    if (typeof position === 'number' && Array.isArray(playersList)) {
      const found = playersList.find((p: any) => p.bracket_position === position && p.is_bot);
      if (found && found.bot_name) return escapeHTML(found.bot_name);
    }
    return 'TBD';
  }

  const player1Name = player1
    ? (player1.is_bot ? escapeHTML(player1.bot_name || 'AI Bot') : escapeHTML(player1.display_name || player1.username || 'Unknown'))
    : positionalBotName(pos1);
  const player2Name = player2
    ? (player2.is_bot ? escapeHTML(player2.bot_name || 'AI Bot') : escapeHTML(player2.display_name || player2.username || 'Unknown'))
    : positionalBotName(pos2);

  const player1Style = player1
    ? 'color:#fff; font-weight:600; text-shadow:0 1px 2px rgba(0,0,0,0.3);'
    : 'color:#888; font-style:italic;';
  const player2Style = player2
    ? 'color:#fff; font-weight:600; text-shadow:0 1px 2px rgba(0,0,0,0.3);'
    : 'color:#888; font-style:italic;';

  const player1Badge = player1 && player1.is_bot
    ? '<span style="font-size:8px; background:rgba(0,0,0,0.3); padding:2px 4px; border-radius:3px; margin-left:6px; text-transform:uppercase; letter-spacing:0.5px; border:1px solid rgba(255,255,255,0.1);">BOT</span>'
    : '';
  const player2Badge = player2 && player2.is_bot
    ? '<span style="font-size:8px; background:rgba(0,0,0,0.3); padding:2px 4px; border-radius:3px; margin-left:6px; text-transform:uppercase; letter-spacing:0.5px; border:1px solid rgba(255,255,255,0.1);">BOT</span>'
    : '';

  const player1Bg = player1
    ? (isFinal ? 'rgba(0,0,0,0.2)' : '#1a202c')
    : '#0f1419';
  const player2Bg = player2
    ? (isFinal ? 'rgba(0,0,0,0.2)' : '#1a202c')
    : '#0f1419';

  const fontSize = isCompact ? '12px' : '14px';
  const padding = isCompact ? '12px' : '20px';
  const minWidth = isCompact ? '200px' : '260px';
  const labelSize = isCompact ? '9px' : '10px';
  const playerPadding = isCompact ? '8px 10px' : '12px 14px';

  return `
    <div class="bracket-match" style="${slotStyle} border-radius:${isCompact ? '10px' : '12px'}; padding:${padding}; min-width:${minWidth}; max-width:${minWidth}; position:relative; backdrop-filter:blur(10px);">
      <div style="
        font-size:${labelSize};
        color:${isFinal ? '#fff' : '#a0aec0'};
        text-transform:uppercase;
        letter-spacing:${isCompact ? '1px' : '2px'};
        margin-bottom:${isCompact ? '8px' : '12px'};
        text-align:center;
        font-weight:700;
        text-shadow:${isFinal ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'};
      ">${matchLabel}</div>
      <div style="display:flex; flex-direction:column; gap:${isCompact ? '6px' : '10px'};">
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:${playerPadding};
          background:${player1Bg};
          border-radius:${isCompact ? '6px' : '8px'};
          border:${player1 ? '1px solid rgba(255,255,255,0.1)' : '1px dashed rgba(255,255,255,0.1)'};
          transition:all 0.2s ease;
        ">
          <span style="${player1Style}; font-size:${fontSize}; display:flex; align-items:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${player1Name}${player1Badge}</span>
          ${player1 && player2 ? '<span style="color:#718096; font-size:10px; font-weight:700; margin:0 6px; flex-shrink:0;">VS</span>' : ''}
        </div>
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:${playerPadding};
          background:${player2Bg};
          border-radius:${isCompact ? '6px' : '8px'};
          border:${player2 ? '1px solid rgba(255,255,255,0.1)' : '1px dashed rgba(255,255,255,0.1)'};
          transition:all 0.2s ease;
        ">
          <span style="${player2Style}; font-size:${fontSize}; display:flex; align-items:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${player2Name}${player2Badge}</span>
          ${player1 && player2 ? '<span style="color:#718096; font-size:10px; font-weight:700; margin:0 6px; flex-shrink:0;">VS</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

async function renderActiveTournament(root: HTMLElement, tournament: any, _user: any) {
  const matches = tournament.matches || [];
  // @ts-expect-error - Reserved for future player list rendering
  const _players = tournament.players || [];

  root.innerHTML = `
    <div class="flex gap-5 items-start">
      <div class="flex-1 min-w-0">
        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
          <div class="flex justify-between items-center">
            <div>
              <h2>Tournament in Progress</h2>
              <p class="text-gray-400 text-sm">${tournament.max_players}-Player Tournament</p>
            </div>
            <a href="/tournament" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap">Back</a>
          </div>
        </div>

        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 mt-4">
          <h3>Matches</h3>
          <div id="matches-list" class="mt-3">
            ${matches.length === 0 ? '<p class="text-gray-400 text-sm">No matches yet.</p>' : ''}
            ${matches.map((m: any) => {
              const p1Name = m.p1_is_bot ? m.p1_bot_name : (m.p1_display_name || m.p1_username || 'Unknown');
              const p2Name = m.p2_is_bot ? m.p2_bot_name : (m.p2_display_name || m.p2_username || 'Unknown');
              const status = m.status === 'finished' ? 'Finished' : m.status === 'playing' ? 'Playing' : 'Pending';
              return `
                <div class="p-3 border border-[#444] rounded-lg mb-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <strong>${escapeHTML(p1Name)}</strong> vs <strong>${escapeHTML(p2Name)}</strong>
                      ${m.status === 'finished' ? ` - ${m.player1_score} : ${m.player2_score}` : ''}
                    </div>
                    <div>
                      <span class="text-xs text-gray-400">${status}</span>
                      ${(() => {
  const user = getCurrentUser();
  const isP1 = user && m.p1_user_id === user.id && !m.p1_is_bot;
  const isP2 = user && m.p2_user_id === user.id && !m.p2_is_bot;
  if (m.status === 'pending' && (isP1 || isP2)) {
    return `<a href="/game/t${tournament.id}-m${m.id}" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap ml-2">Play</a>`;
  } else if ((m.status === 'pending' || m.status === 'playing')) {
    return `<a href="/game/t${tournament.id}-m${m.id}" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px ml-2">Spectate</a>`;
  } else {
    return '';
  }
})()}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="w-[350px] flex-shrink-0">
        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
          <h3 class="mb-3">Live Chat</h3>
          <div id="chat-messages" class="min-h-[300px] max-h-[500px] overflow-y-auto p-3 bg-[#1a1a1a] rounded-lg mt-3 mb-3">
            <div class="text-gray-400 text-xs text-center p-4">No messages yet. Start chatting!</div>
          </div>
          <div class="flex gap-2">
            <input type="text" id="chat-input" placeholder="Type a message..." class="flex-1 p-2 bg-[#333] border-0 rounded-md text-white text-sm" />
            <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="chat-send">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Setup chat functionality (always available)
  setupTournamentChat(root, tournament.id);

  // Auto-refresh matches every 3 seconds
  const refreshInterval = setInterval(async () => {
    if (document.contains(root)) {
      try {
        const result = await tournamentAPI.getTournament(tournament.id);
        const updatedTournament = result.tournament;
        const matchesListEl = root.querySelector('#matches-list');
        if (matchesListEl) {
          const updatedMatches = updatedTournament.matches || [];
          matchesListEl.innerHTML = updatedMatches.length === 0 ? '<p class="text-gray-400 text-sm">No matches yet.</p>' : updatedMatches.map((m: any) => {
            const p1Name = m.p1_is_bot ? m.p1_bot_name : (m.p1_display_name || m.p1_username || 'Unknown');
            const p2Name = m.p2_is_bot ? m.p2_bot_name : (m.p2_display_name || m.p2_username || 'Unknown');
            const status = m.status === 'finished' ? 'Finished' : m.status === 'playing' ? 'Playing' : 'Pending';
            return `
              <div class="p-3 border border-[#444] rounded-lg mb-2">
                <div class="flex justify-between items-center">
                  <div>
                    <strong>${escapeHTML(p1Name)}</strong> vs <strong>${escapeHTML(p2Name)}</strong>
                    ${m.status === 'finished' ? ` - ${m.player1_score} : ${m.player2_score}` : ''}
                  </div>
                  <div>
                    <span class="text-xs text-gray-400">${status}</span>
                    ${(() => {
                      const user = getCurrentUser();
                      const isP1 = user && m.p1_user_id === user.id && !m.p1_is_bot;
                      const isP2 = user && m.p2_user_id === user.id && !m.p2_is_bot;
                      if (m.status === 'pending' && (isP1 || isP2)) {
                        return `<a href="/game/t${tournament.id}-m${m.id}" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap ml-2">Play</a>`;
                      } else if ((m.status === 'pending' || m.status === 'playing')) {
                        return `<a href="/game/t${tournament.id}-m${m.id}" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px ml-2">Spectate</a>`;
                      } else {
                        return '';
                      }
                    })()}
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err: any) {
        console.error('Error refreshing tournament:', err);
      }
    } else {
      clearInterval(refreshInterval);
    }
  }, 3000);

  return root;
}
