import { friendService } from "../services/friend";
import { onlineGameService } from "../services/onlineGame";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import "../styles/friend.css";
import backgroundImage from "../assets/images/background.jpg";

import { getToken } from "../utils/auth";

export function renderFriendPage(): string {
  setTimeout(() => {
    loadFriends();
  }, 0);

  return `
    <div class="friend-container" style="background-image: url('${backgroundImage}')">
      <div class="friend-overlay"></div>
      <div class="friend-content">
        <div id="friend-root" class="w-full max-w-[900px]">
          <div class="text-center text-white font-['Pixel_Game']">Loading friends...</div>
        </div>
      </div>
    </div>
  `;
}

async function loadFriends() {
  const root = document.getElementById("friend-root");
  if (!root) return;

  try {
    const response = await friendService.getFriends();
    const friends = response.friends || [];

    root.innerHTML = `
      <div class="friend-box">
        <h2 class="friend-title">FRIENDS</h2>
        
        <!-- Friends List Section -->
        <div class="friend-list-section">
          <h3 class="friend-section-title">YOUR FRIENDS</h3>
          <div class="friend-list" id="friends-list">
            ${friends.length === 0 ? '<p class="friend-list-empty">No friends yet.</p>' : friends.map((f: any) => `
              <div class="friend-list-item">
                <div>
                  <div class="friend-display-name">${f.display_name || f.username}</div>
                  <div class="friend-username">@${f.username}</div>
                </div>
                <button class="friend-play-btn" 
                        data-play-id="${f.id}" data-play-name="${f.username}">PLAY</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Add Friend Section -->
        <div class="friend-add-section">
          <h3 class="friend-section-title">ADD FRIEND</h3>
          <div class="friend-search-bar">
            <input type="text" id="search-input" placeholder="Search username..." 
                   class="friend-search-input">
            <button id="search-btn" class="friend-search-btn">SEARCH</button>
          </div>
          <div id="search-results" class="friend-search-results"></div>
        </div>

        <div class="friend-footer">
          <button id="btn-back" class="friend-back-btn">BACK</button>
        </div>
      </div>
    `;

    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));

    // Play buttons
    root.querySelectorAll('[data-play-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = (btn as HTMLElement).dataset.playName;
        const friendId = (btn as HTMLElement).dataset.playId;
        
        if (name && friendId) {
          const token = getToken();
          if (!token) return;
          
          const user = await authService.getCurrentUser();
          onlineGameService.connect(token);
          
          // Listen for game creation
          const onGameCreated = () => {
             const gameId = onlineGameService.getCurrentGameId();
             if (gameId) {
                 navigateTo(`/online-game?id=${gameId}`);
             }
          };
          
          onlineGameService.onGameStateUpdate(onGameCreated);

          // Wait a bit for connection
          setTimeout(() => {
            onlineGameService.createGame(user.username, name, friendId);
          }, 500);
        }
      });
    });

    // Search
    const searchInput = document.getElementById("search-input") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn");
    const resultsDiv = document.getElementById("search-results");

    // Connect to receive invites
    const token = getToken();
    if (token) {
      onlineGameService.connect(token);
      
      onlineGameService.onGameInvite((inviterName, gameId) => {
        // Show invite notification
        const inviteDiv = document.createElement('div');
        inviteDiv.className = 'friend-invite-notification';
        inviteDiv.innerHTML = `
          <div class="friend-invite-content">
            <span class="friend-invite-text"><strong>${inviterName}</strong> invited you to play!</span>
            <div class="friend-invite-actions">
              <button class="friend-invite-accept" id="accept-${gameId}">ACCEPT</button>
              <button class="friend-invite-decline" id="decline-${gameId}">DECLINE</button>
            </div>
          </div>
        `;
        
        // Style the notification
        inviteDiv.style.position = 'fixed';
        inviteDiv.style.top = '20px';
        inviteDiv.style.right = '20px';
        inviteDiv.style.backgroundColor = '#1e293b';
        inviteDiv.style.border = '2px solid #7dd3fc';
        inviteDiv.style.padding = '15px';
        inviteDiv.style.borderRadius = '8px';
        inviteDiv.style.zIndex = '1000';
        inviteDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
        inviteDiv.style.color = 'white';
        inviteDiv.style.fontFamily = "'Pixel Game', monospace";
        
        const acceptBtn = inviteDiv.querySelector(`#accept-${gameId}`) as HTMLElement;
        const declineBtn = inviteDiv.querySelector(`#decline-${gameId}`) as HTMLElement;
        
        if (acceptBtn) {
          acceptBtn.style.backgroundColor = '#4ade80';
          acceptBtn.style.color = '#0f172a';
          acceptBtn.style.border = 'none';
          acceptBtn.style.padding = '5px 10px';
          acceptBtn.style.marginRight = '10px';
          acceptBtn.style.cursor = 'pointer';
          acceptBtn.style.fontFamily = 'inherit';
          
          acceptBtn.onclick = () => {
            navigateTo(`/online-game?id=${gameId}`);
            document.body.removeChild(inviteDiv);
          };
        }
        
        if (declineBtn) {
          declineBtn.style.backgroundColor = '#f87171';
          declineBtn.style.color = '#0f172a';
          declineBtn.style.border = 'none';
          declineBtn.style.padding = '5px 10px';
          declineBtn.style.cursor = 'pointer';
          declineBtn.style.fontFamily = 'inherit';
          
          declineBtn.onclick = () => {
            document.body.removeChild(inviteDiv);
          };
        }
        
        document.body.appendChild(inviteDiv);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
          if (document.body.contains(inviteDiv)) {
            document.body.removeChild(inviteDiv);
          }
        }, 10000);
      });
    }

    const doSearch = async () => {
      const query = searchInput.value.trim();
      if (!query || !resultsDiv) return;
      
      resultsDiv.innerHTML = '<div class="text-gray-500 text-sm">Searching...</div>';
      try {
        const res = await friendService.searchUsers(query);
        const users = res.users || [];
        
        if (users.length === 0) {
          resultsDiv.innerHTML = '<div class="text-gray-500 text-sm">No users found.</div>';
          return;
        }

        resultsDiv.innerHTML = users.map((u: any) => `
          <div class="friend-search-result-item">
            <span class="friend-search-result-name">${u.username}</span>
            <button class="friend-add-btn" data-add-id="${u.id}">ADD</button>
          </div>
        `).join('');

        resultsDiv.querySelectorAll('[data-add-id]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = parseInt((btn as HTMLElement).dataset.addId || "0");
            if (id) {
              try {
                await friendService.addFriend(id);
                alert("Friend added!");
                loadFriends(); // Reload list
              } catch (e) {
                alert("Failed to add friend");
              }
            }
          });
        });

      } catch (e) {
        resultsDiv.innerHTML = '<div class="text-red-400 text-sm">Error searching.</div>';
      }
    };

    searchBtn?.addEventListener("click", doSearch);
    searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") doSearch();
    });

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load friends.</div>';
  }
}
