import { tournamentService } from "../services/tournament";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { getToken } from "../utils/auth";
import { i18n } from "../services/i18n";
import { showNotification, showConfirm } from "../utils/notifications";
import { tournamentGameService } from "../services/tournamentGame";
import type { TournamentListItem, Tournament, TournamentPlayer } from "../types/tournament";
import "../styles/tournament.css";
import backgroundImage from "../assets/images/background.jpg";

// Simple WebSocket Chat Client for Tournament
class TournamentChat {
  private ws: WebSocket | null = null;
  private tournamentId: number;
  private onMessage: (msg: any) => void;

  constructor(tournamentId: number, onMessage: (msg: any) => void) {
    this.tournamentId = tournamentId;
    this.onMessage = onMessage;
    this.connect();
  }

  private connect() {
    const token = getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.send({ type: 'JOIN_TOURNAMENT_CHAT', tournamentId: this.tournamentId });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'TOURNAMENT_CHAT_MESSAGE') {
          this.onMessage(data.chatMessage);
        } else if (data.type === 'TOURNAMENT_CHAT_HISTORY') {
          if (Array.isArray(data.messages)) {
            data.messages.forEach((m: any) => this.onMessage(m));
          }
        }
      } catch { /* ignore parse errors */ }
    };
  }

  sendChat(message: string) {
    this.send({ type: 'SEND_TOURNAMENT_CHAT', message });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

let currentChat: TournamentChat | null = null;

export function renderTournamentPage(params?: Record<string, string>): string {
  setTimeout(() => {
    if (params && params.id) {
      loadTournamentDetail(parseInt(params.id));
    } else {
      loadTournaments();
    }
  }, 0);

  return `
    <div class="tournament-container" style="background-image: url('${backgroundImage}')">
      <div class="tournament-overlay"></div>
      <div class="tournament-content" style="max-width: 1200px; width: 100%;">
        <div id="tournament-root" class="w-full">
          <div class="text-center text-white font-['Pixel_Game']">${i18n.t('loading')}</div>
        </div>
      </div>
    </div>
  `;
}

async function loadTournaments() {
  const root = document.getElementById("tournament-root");
  if (!root) return;

  try {
    const res = await tournamentService.getActiveTournaments();
    const tournaments: TournamentListItem[] = res.tournaments || [];

    root.innerHTML = `
      <div class="tournament-box">
        <h2 class="text-[#e0f7ff] font-['Pixel_Game'] text-3xl mb-6">${i18n.t('tournaments')}</h2>
        
        <div class="flex flex-col md:flex-row gap-6 text-left">
          <!-- Create -->
          <div class="w-full md:w-1/3">
            <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-4 border-b border-[#2c6b87] pb-1">${i18n.t('create_new')}</h3>
            <div class="space-y-3">
              <button id="create-4" class="w-full bg-[#2c6b87] text-white py-3 font-['Pixel_Game'] hover:bg-[#3d8aa8] border-2 border-[#4a9dc0]">
${i18n.t('4_players')}
              </button>
              <button id="create-8" class="w-full bg-[#2c6b87] text-white py-3 font-['Pixel_Game'] hover:bg-[#3d8aa8] border-2 border-[#4a9dc0]">
${i18n.t('8_players')}
              </button>
            </div>
          </div>

          <!-- List -->
          <div class="flex-1">
            <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-4 border-b border-[#2c6b87] pb-1">${i18n.t('active_tournaments')}</h3>
            <div class="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              ${tournaments.length === 0 ? `<p class="text-gray-500 text-sm">${i18n.t('no_active_tournaments')}</p>` : tournaments.map((t: TournamentListItem) => `
                <div class="bg-[#0d1a28] p-3 border border-[#2c6b87] flex justify-between items-center">
                  <div>
                    <div class="text-[#e0f7ff] font-['Pixel_Game']">${t.creator_username}'s Tournament</div>
                    <div class="text-[#5db3d1] text-xs">${t.current_players}/${t.max_players} Players</div>
                  </div>
                  <button class="bg-[#2c6b87] text-white px-3 py-1 text-xs font-['Pixel_Game'] hover:bg-[#3d8aa8]" 
                          data-id="${t.id}">${i18n.t('join')}</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <button id="btn-back" class="text-[#5db3d1] hover:text-white font-['Pixel_Game']">← ${i18n.t('back')}</button>
        </div>
      </div>
    `;

    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
    
    document.getElementById("create-4")?.addEventListener("click", () => createTournament(4));
    document.getElementById("create-8")?.addEventListener("click", () => createTournament(8));

    root.querySelectorAll('[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) navigateTo(`/tournament/${id}`);
      });
    });

  } catch (e) {
    root.innerHTML = '<div class="text-red-500">Failed to load tournaments.</div>';
  }
}

async function createTournament(size: 4 | 8) {
  try {
    const res = await tournamentService.createTournament(size);
    navigateTo(`/tournament/${res.tournament.id}`);
  } catch (e) {
    showNotification("Failed to create tournament", { type: 'error' });
  }
}

async function loadTournamentDetail(id: number) {
  const root = document.getElementById("tournament-root");
  if (!root) return;

  try {
    const res = await tournamentService.getTournament(id);
    const t: Tournament = res.tournament;

    // Simple bracket view
    const players: TournamentPlayer[] = t.players || [];
    const matches: any[] = (t as any).matches || []; // Assume matches exist on tournament object
    const isFull = players.length >= t.max_players;
    const currentUser = await authService.getCurrentUser();

    // Clean up previous chat if exists
    if (currentChat) {
      currentChat.close();
      currentChat = null;
    }

    root.innerHTML = `
      <div class="tournament-box">
        
        <div class="flex flex-col lg:flex-row gap-6 text-left">
          <!-- Left Side: Tournament Info -->
          <div class="flex-1">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-[#e0f7ff] font-['Pixel_Game'] text-2xl">${i18n.t('tournament_num')}${t.id}</h2>
              <div class="text-[#5db3d1] font-['Pixel_Game']">${t.status.toUpperCase()}</div>
            </div>

          <div class="mb-6">
            <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2">${i18n.t('players')} (${players.length}/${t.max_players})</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              ${Array.from({ length: t.max_players }).map((_, i) => {
                const p = players.find((pl: TournamentPlayer) => pl.bracket_position === i);
                return `
                  <div class="bg-[#0d1a28] p-2 border border-[#2c6b87] text-center">
                    <div class="text-[#e0f7ff] text-sm truncate">${p ? (p.display_name || p.username) : i18n.t('empty')}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          ${matches.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2">${i18n.t('matches')}</h3>
              <div class="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                ${matches.map(m => {
                  const p1 = m.p1_display_name || m.p1_username || (m.p1_is_bot ? m.p1_bot_name : i18n.t('tbd'));
                  const p2 = m.p2_display_name || m.p2_username || (m.p2_is_bot ? m.p2_bot_name : i18n.t('tbd'));
                  const status = m.status;
                  
                  let actionBtn = '';
                  if (status === 'pending' || status === 'playing') {
                    const isP1 = currentUser && m.p1_user_id === currentUser.id && !m.p1_is_bot;
                    const isP2 = currentUser && m.p2_user_id === currentUser.id && !m.p2_is_bot;
                    
                    if (status === 'pending' && (isP1 || isP2)) {
                      actionBtn = '<button class="bg-green-600 text-white px-3 py-1 text-xs font-[\'Pixel_Game\'] hover:bg-green-500" data-play-match="' + m.id + '">' + i18n.t('play') + '</button>';
                    } else {
                      actionBtn = '<button class="bg-[#2c6b87] text-white px-3 py-1 text-xs font-[\'Pixel_Game\'] hover:bg-[#3d8aa8]" data-spectate-match="' + m.id + '">' + i18n.t('spectate') + '</button>';
                    }
                  } else if (status === 'finished') {
                    actionBtn = '<span class="text-gray-500 text-xs font-[\'Pixel_Game\']">' + m.player1_score + ' - ' + m.player2_score + '</span>';
                  }

                  const p1Class = m.winner_id === m.p1_user_id && status === 'finished' ? 'text-green-400' : '';
                  const p2Class = m.winner_id === m.p2_user_id && status === 'finished' ? 'text-green-400' : '';

                  return '<div class="bg-[#0d1a28] p-2 border border-[#2c6b87] flex justify-between items-center">' +
                    '<div class="text-[#e0f7ff] text-sm">' +
                      '<span class="' + p1Class + '">' + p1 + '</span>' +
                      '<span class="text-[#5db3d1] mx-1">' + i18n.t('vs') + '</span>' +
                      '<span class="' + p2Class + '">' + p2 + '</span>' +
                    '</div>' +
                    '<div>' + actionBtn + '</div>' +
                  '</div>';
                }).join('')}
              </div>
            </div>
          ` : ''}

          <div class="flex gap-4 justify-center mt-8 flex-wrap">
            ${!isFull ? `<button id="btn-join" class="bg-[#2c6b87] text-white px-6 py-2 font-['Pixel_Game'] hover:bg-[#3d8aa8]">${i18n.t('join')}</button>` : ''}
            ${!isFull && t.status === 'waiting' ? `<button id="btn-bots" class="bg-[#1a4558] text-[#5db3d1] px-6 py-2 font-['Pixel_Game'] hover:text-white">${i18n.t('fill_bots')}</button>` : ''}
            ${t.status === 'waiting' && isFull ? `<button id="btn-start" class="bg-green-600 text-white px-6 py-2 font-['Pixel_Game'] hover:bg-green-500">${i18n.t('start')}</button>` : ''}
            ${currentUser && t.creator_id === currentUser.id ? `<button id="btn-delete" class="bg-red-600 text-white px-6 py-2 font-['Pixel_Game'] hover:bg-red-500">${i18n.t('delete')}</button>` : ''}
          </div>

          <div class="mt-6">
            <button id="btn-back" class="text-[#5db3d1] hover:text-white font-['Pixel_Game']">← ${i18n.t('back')}</button>
          </div>
        </div>

        <!-- Right Side: Chat -->
        <div class="w-full lg:w-80 flex flex-col bg-[#0d1a28] border border-[#2c6b87] h-[500px]">
          <div class="p-3 border-b border-[#2c6b87] bg-[#1a4558]">
            <h3 class="text-[#e0f7ff] font-['Pixel_Game']">${i18n.t('tournament_chat')}</h3>
          </div>
          <div id="chat-messages" class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <div class="text-gray-500 text-xs text-center">${i18n.t('welcome_chat')}</div>
          </div>
          <div class="p-2 border-t border-[#2c6b87] flex gap-2">
            <input type="text" id="chat-input" placeholder="${i18n.t('type_message')}" 
                   class="flex-1 bg-[#0a1929] border border-[#2c6b87] text-[#e0f7ff] px-2 py-1 text-sm focus:outline-none">
            <button id="chat-send" class="bg-[#2c6b87] text-white px-3 py-1 font-['Pixel_Game'] text-sm hover:bg-[#3d8aa8]">${i18n.t('send')}</button>
          </div>
        </div>

      </div>
    `;

    // Setup Chat
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input") as HTMLInputElement;
    const chatSend = document.getElementById("chat-send");

    const appendMessage = (msg: any) => {
      if (!chatMessages) return;
      const div = document.createElement("div");
      div.className = "bg-[#1a4558]/50 p-2 rounded border-l-2 border-[#5db3d1]";
      div.innerHTML = `
        <div class="flex justify-between items-baseline">
          <span class="text-[#5db3d1] text-xs font-bold">${msg.username}</span>
          <span class="text-gray-500 text-[10px]">${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="text-[#e0f7ff] text-sm break-words">${msg.message}</div>
      `;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    currentChat = new TournamentChat(id, appendMessage);

    const sendMessage = () => {
      const text = chatInput.value.trim();
      if (text && currentChat) {
        currentChat.sendChat(text);
        chatInput.value = "";
      }
    };

    chatSend?.addEventListener("click", sendMessage);
    chatInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    document.getElementById("btn-back")?.addEventListener("click", () => {
      if (currentChat) {
        currentChat.close();
        currentChat = null;
      }
      navigateTo("/tournament");
    });

    // Match Actions
    root.querySelectorAll('[data-play-match]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const matchId = (btn as HTMLElement).dataset.playMatch;
        if (matchId) {
          try {
            const { gameId } = await tournamentGameService.getOrCreateGameForMatch(id, Number(matchId));
            navigateTo(`/online-game?id=${gameId}`);
          } catch (e) {
            showNotification("Failed to start match", { type: 'error' });
          }
        }
      });
    });

    root.querySelectorAll('[data-spectate-match]').forEach(btn => {
      btn.addEventListener('click', () => {
        const matchId = (btn as HTMLElement).dataset.spectateMatch;
        if (matchId) navigateTo(`/online-game?id=${matchId}`);
      });
    });
    
    document.getElementById("btn-join")?.addEventListener("click", async () => {
      try {
        await tournamentService.joinTournament(id);
        loadTournamentDetail(id);
      } catch (e) { showNotification("Failed to join", { type: 'error' }); }
    });

    document.getElementById("btn-bots")?.addEventListener("click", async () => {
      try {
        await tournamentService.fillTournamentWithBots(id);
        loadTournamentDetail(id);
      } catch (e) { showNotification("Failed to fill bots", { type: 'error' }); }
    });

    document.getElementById("btn-start")?.addEventListener("click", async () => {
      try {
        await tournamentService.startTournament(id);
        loadTournamentDetail(id);
      } catch (e) { showNotification("Failed to start", { type: 'error' }); }
    });

    document.getElementById("btn-delete")?.addEventListener("click", async () => {
      const confirmed = await showConfirm({
        title: i18n.t('tournament'),
        message: i18n.t('confirm_delete'),
        confirmText: i18n.t('delete'),
        cancelText: i18n.t('back')
      });

      if (confirmed) {
        try {
          await tournamentService.deleteTournament(id);
          navigateTo("/tournament");
        } catch (e) { showNotification("Failed to delete", { type: 'error' }); }
      }
    });

  } catch (e) {
    root.innerHTML = '<div class="text-red-500">Failed to load tournament details.</div>';
  }
}
