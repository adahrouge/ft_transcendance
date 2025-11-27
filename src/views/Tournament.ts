// src/views/Tournament.ts
import { navigate } from '../router.js';
import { escapeHTML } from '../utils.js';
import { getCurrentUser } from '../user-state.js';
import { tournamentAPI } from '../api.js';

export const TournamentView = async (params: Record<string, string>) => {
  const user = getCurrentUser();
  
  // Require authentication
  if (!user) {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="card">
        <h2>Tournament</h2>
        <p class="muted">You must be logged in to access tournaments.</p>
        <div class="row" style="margin-top:16px;">
          <a href="/profile" data-link class="btn primary">Login / Register</a>
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
    <div class="card">
      <h2>Tournaments</h2>
      <p class="muted">Create a new tournament or join an active one.</p>
      
      <h3 style="margin-top:24px;">Create Tournament</h3>
      <div class="row" style="gap:12px; margin-top:12px;">
        <button class="btn primary" id="create-4">Create 4-Player Tournament</button>
        <button class="btn primary" id="create-8">Create 8-Player Tournament</button>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>Active Tournaments</h3>
      <div id="tournaments-list" style="margin-top:12px;">
        <p class="muted">Loading tournaments...</p>
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
  
  const messages: Array<{username: string, message: string, timestamp: Date}> = [];
  
  function renderMessages() {
    if (messages.length === 0) {
      chatMessages.innerHTML = '<div style="color:#888; font-size:12px; text-align:center; padding:16px;">No messages yet. Start chatting!</div>';
      return;
    }
    
    chatMessages.innerHTML = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      return `
        <div style="margin-bottom:8px; padding:8px; background:#222; border-radius:6px; border-left:3px solid #5e81f4;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong style="color:#5e81f4; font-size:12px;">${escapeHTML(msg.username)}</strong>
            <span style="color:#666; font-size:11px;">${time}</span>
          </div>
          <div style="color:#ddd; font-size:13px; word-wrap:break-word; line-height:1.4;">${escapeHTML(msg.message)}</div>
        </div>
      `;
    }).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !user) return;
    
    messages.push({
      username: user.display_name || user.username,
      message: text,
      timestamp: new Date()
    });
    
    chatInput.value = '';
    renderMessages();
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
      listEl.innerHTML = '<p class="muted">No active tournaments. Create one to get started!</p>';
      return;
    }
    
    listEl.innerHTML = tournaments.map((t: any) => `
      <div style="padding:12px; border:1px solid #444; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>${escapeHTML(t.creator_display_name || t.creator_username)}'s Tournament</strong>
          <div style="font-size:14px; color:#aaa; margin-top:4px;">
            ${t.max_players} players • ${t.current_players || 0}/${t.max_players} joined
          </div>
        </div>
        <a href="/tournament/${t.id}" data-link class="btn primary">View / Join</a>
      </div>
    `).join('');
  } catch (err: any) {
    listEl.innerHTML = `<p class="muted" style="color:#f44;">Error loading tournaments: ${err.message}</p>`;
  }
}

async function renderTournamentDetail(root: HTMLElement, tournamentId: number, user: any) {
  try {
    const result = await tournamentAPI.getTournament(tournamentId);
    const tournament = result.tournament;
    
    if (!tournament) {
      root.innerHTML = `
        <div class="card">
          <h2>Tournament Not Found</h2>
          <a href="/tournament" data-link class="btn">Back to Tournaments</a>
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
      <div style="display:flex; gap:20px; align-items:flex-start;">
        <div style="flex:1; min-width:0;">
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h2>Tournament Lobby</h2>
                <p class="muted">${tournament.max_players}-Player Tournament</p>
              </div>
              <div style="display:flex; gap:8px;">
                ${isCreator ? `
                  <button class="btn" id="delete-tournament" style="background:#dc2626; color:#fff; border:none;">Delete</button>
                ` : ''}
                <a href="/tournament" data-link class="btn">Back</a>
              </div>
            </div>
          </div>
          
          <div class="card" style="margin-top:16px;">
            <h3 style="margin-bottom:16px;">Tournament Bracket</h3>
            <div id="bracket-container" style="overflow-x:auto; overflow-y:hidden; max-width:100%;">
              ${renderBracketView(players, tournament.max_players)}
            </div>
            
            ${showJoinButton ? `
              <div style="margin-top:20px; text-align:center;">
                <button class="btn primary" id="join-tournament">Join Tournament</button>
              </div>
            ` : ''}
            
            ${isCreator && !isFull ? `
              <div style="margin-top:20px; padding-top:20px; border-top:2px solid #444; text-align:center;">
                <p class="muted" style="margin-bottom:12px;">Waiting for users to join...</p>
                <button class="btn outline" id="fill-bots">Fill Tournament with bots instead</button>
              </div>
            ` : ''}
            
            ${canStart ? `
              <div style="margin-top:20px; padding-top:20px; border-top:2px solid #444; text-align:center;">
                <button class="btn primary" id="start-tournament" style="font-size:16px; padding:12px 24px;">Start Tournament</button>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="width:350px; flex-shrink:0;">
          <div class="card">
            <h3 style="margin-bottom:12px;">Live Chat</h3>
            <div id="chat-messages" style="min-height:300px; max-height:500px; overflow-y:auto; padding:12px; background:#1a1a1a; border-radius:8px; margin-top:12px; margin-bottom:12px;">
              <div style="color:#888; font-size:12px; text-align:center; padding:16px;">No messages yet. Start chatting!</div>
            </div>
            <div style="display:flex; gap:8px;">
              <input type="text" id="chat-input" placeholder="Type a message..." style="flex:1; padding:8px; background:#333; border:none; border-radius:6px; color:#fff; font-size:14px;" />
              <button class="btn primary" id="chat-send" style="padding:8px 16px;">Send</button>
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
          navigate(`/tournament/${tournamentId}`);
        } catch (err: any) {
          fillBotsBtn.disabled = false;
          fillBotsBtn.textContent = 'Fill Tournament with bots: No empty slots';
          console.error('Fill bots error:', err);
        }
      };
    }
    
    // Start tournament handler
    const startBtn = root.querySelector('#start-tournament') as HTMLButtonElement | null;
    if (startBtn) {
      startBtn.onclick = async () => {
        if (!confirm('Start the tournament? This will generate the bracket and begin matches.')) {
          return;
        }
        try {
          await tournamentAPI.startTournament(tournamentId);
          navigate(`/tournament/${tournamentId}`);
        } catch (err: any) {
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
        } catch (err) {
          console.error('Error refreshing tournament:', err);
        }
      } else {
        clearInterval(refreshInterval);
      }
    }, 2000);
    
    return root;
  } catch (err: any) {
    root.innerHTML = `
      <div class="card">
        <h2>Error</h2>
        <p class="muted">${escapeHTML(err.message || 'Failed to load tournament')}</p>
        <a href="/tournament" data-link class="btn" style="margin-top:16px;">Back to Tournaments</a>
      </div>
    `;
    return root;
  }
}

function renderPlayersList(players: any[], maxPlayers: number): string {
  const slots: string[] = [];
  
  for (let i = 0; i < maxPlayers; i++) {
    const player = players.find((p: any) => p.bracket_position === i);
    if (player) {
      const name = player.is_bot 
        ? escapeHTML(player.bot_name || 'AI Bot')
        : escapeHTML(player.display_name || player.username || 'Unknown');
      const badge = player.is_bot ? '<span style="font-size:11px; background:#555; padding:2px 6px; border-radius:4px; margin-left:8px;">BOT</span>' : '';
      slots.push(`<div style="padding:8px; background:#2a2a2a; border-radius:6px; margin-bottom:6px;">${name}${badge}</div>`);
    } else {
      slots.push(`<div style="padding:8px; background:#1a1a1a; border-radius:6px; margin-bottom:6px; color:#666; border:1px dashed #444;">Empty Slot</div>`);
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
  const fontSize = is8Player ? '12px' : '14px';
  const padding = is8Player ? '12px' : '20px';
  
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

async function renderActiveTournament(root: HTMLElement, tournament: any, user: any) {
  const matches = tournament.matches || [];
  const players = tournament.players || [];
  
  root.innerHTML = `
    <div style="display:flex; gap:20px; align-items:flex-start;">
      <div style="flex:1; min-width:0;">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h2>Tournament in Progress</h2>
              <p class="muted">${tournament.max_players}-Player Tournament</p>
            </div>
            <a href="/tournament" data-link class="btn">Back</a>
          </div>
        </div>
        
        <div class="card" style="margin-top:16px;">
          <h3>Matches</h3>
          <div id="matches-list" style="margin-top:12px;">
            ${matches.length === 0 ? '<p class="muted">No matches yet.</p>' : ''}
            ${matches.map((m: any) => {
              const p1Name = m.p1_is_bot ? m.p1_bot_name : (m.p1_display_name || m.p1_username || 'Unknown');
              const p2Name = m.p2_is_bot ? m.p2_bot_name : (m.p2_display_name || m.p2_username || 'Unknown');
              const status = m.status === 'finished' ? 'Finished' : m.status === 'playing' ? 'Playing' : 'Pending';
              return `
                <div style="padding:12px; border:1px solid #444; border-radius:8px; margin-bottom:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <strong>${escapeHTML(p1Name)}</strong> vs <strong>${escapeHTML(p2Name)}</strong>
                      ${m.status === 'finished' ? ` - ${m.player1_score} : ${m.player2_score}` : ''}
                    </div>
                    <div>
                      <span style="font-size:12px; color:#aaa;">${status}</span>
                      ${m.status === 'pending' ? `<a href="/game/t${tournament.id}-m${m.id}" data-link class="btn" style="margin-left:8px;">Play</a>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      
      <div style="width:350px; flex-shrink:0;">
        <div class="card">
          <h3 style="margin-bottom:12px;">Live Chat</h3>
          <div id="chat-messages" style="min-height:300px; max-height:500px; overflow-y:auto; padding:12px; background:#1a1a1a; border-radius:8px; margin-top:12px; margin-bottom:12px;">
            <div style="color:#888; font-size:12px; text-align:center; padding:16px;">No messages yet. Start chatting!</div>
          </div>
          <div style="display:flex; gap:8px;">
            <input type="text" id="chat-input" placeholder="Type a message..." style="flex:1; padding:8px; background:#333; border:none; border-radius:6px; color:#fff; font-size:14px;" />
            <button class="btn primary" id="chat-send" style="padding:8px 16px;">Send</button>
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
          matchesListEl.innerHTML = updatedMatches.length === 0 ? '<p class="muted">No matches yet.</p>' : updatedMatches.map((m: any) => {
            const p1Name = m.p1_is_bot ? m.p1_bot_name : (m.p1_display_name || m.p1_username || 'Unknown');
            const p2Name = m.p2_is_bot ? m.p2_bot_name : (m.p2_display_name || m.p2_username || 'Unknown');
            const status = m.status === 'finished' ? 'Finished' : m.status === 'playing' ? 'Playing' : 'Pending';
            return `
              <div style="padding:12px; border:1px solid #444; border-radius:8px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong>${escapeHTML(p1Name)}</strong> vs <strong>${escapeHTML(p2Name)}</strong>
                    ${m.status === 'finished' ? ` - ${m.player1_score} : ${m.player2_score}` : ''}
                  </div>
                  <div>
                    <span style="font-size:12px; color:#aaa;">${status}</span>
                    ${m.status === 'pending' ? `<a href="/game/t${tournament.id}-m${m.id}" data-link class="btn" style="margin-left:8px;">Play</a>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err) {
        console.error('Error refreshing tournament:', err);
      }
    } else {
      clearInterval(refreshInterval);
    }
  }, 3000);

  return root;
}
