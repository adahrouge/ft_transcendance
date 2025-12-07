import { friendService } from "../services/friend";
import { onlineGameService } from "../services/onlineGame";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import "../styles/friend.css";
import backgroundImage from "../assets/images/background.jpg";

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
        if (name) {
          const user = await authService.getCurrentUser();
          onlineGameService.connect();
          // Wait a bit for connection
          setTimeout(() => {
            onlineGameService.createGame(user.username, name);
            navigateTo("/online-game"); // Assuming we route to online game page
          }, 500);
        }
      });
    });

    // Search
    const searchInput = document.getElementById("search-input") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn");
    const resultsDiv = document.getElementById("search-results");

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
