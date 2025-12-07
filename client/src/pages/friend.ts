import { friendService } from "../services/friend";
import { onlineGameService } from "../services/onlineGame";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import "../styles/home.css";
import "../styles/friend.css";
import backgroundImage from "../assets/images/background.jpg";

export function renderFriendPage(): string {
  setTimeout(() => {
    loadFriends();
  }, 0);

  return `
    <div class="home-container" style="background-image: url('${backgroundImage}')">
      <div class="home-overlay"></div>
      <div class="home-content">
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
        
        <div class="flex flex-col md:flex-row gap-6 text-left">
          <!-- Friends List -->
          <div class="flex-1">
            <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2 border-b border-[#2c6b87] pb-1">YOUR FRIENDS</h3>
            <div class="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar" id="friends-list">
              ${friends.length === 0 ? '<p class="text-gray-500 text-sm">No friends yet.</p>' : friends.map((f: any) => `
                <div class="bg-[#0d1a28] p-3 border border-[#2c6b87] flex justify-between items-center">
                  <div>
                    <div class="text-[#e0f7ff] font-['Pixel_Game']">${f.display_name || f.username}</div>
                    <div class="text-[#5db3d1] text-xs">@${f.username}</div>
                  </div>
                  <button class="bg-[#2c6b87] text-white px-3 py-1 text-xs font-['Pixel_Game'] hover:bg-[#3d8aa8]" 
                          data-play-id="${f.id}" data-play-name="${f.username}">PLAY</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Search -->
          <div class="flex-1">
            <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2 border-b border-[#2c6b87] pb-1">ADD FRIEND</h3>
            <div class="flex gap-2 mb-4">
              <input type="text" id="search-input" placeholder="Search username..." 
                     class="flex-1 bg-[#0d1a28] border border-[#2c6b87] text-[#e0f7ff] px-3 py-2 font-['Pixel_Game'] focus:outline-none focus:border-[#4a9dc0]">
              <button id="search-btn" class="bg-[#2c6b87] text-white px-4 font-['Pixel_Game'] hover:bg-[#3d8aa8]">SEARCH</button>
            </div>
            <div id="search-results" class="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar"></div>
          </div>
        </div>

        <div class="mt-6">
          <button id="btn-back" class="text-[#5db3d1] hover:text-white font-['Pixel_Game']">← BACK</button>
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
          <div class="bg-[#0d1a28] p-2 border border-[#2c6b87] flex justify-between items-center">
            <span class="text-[#e0f7ff] text-sm">${u.username}</span>
            <button class="text-[#5db3d1] text-xs hover:text-white font-['Pixel_Game']" data-add-id="${u.id}">ADD</button>
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
