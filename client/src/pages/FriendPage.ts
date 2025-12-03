// src/views/Friend.ts
import { navigate } from '../router.js';
import { getCurrentUser } from '../utils/user.js';
import { escapeHTML } from '../utils/utils.js';
import { userAPI } from '../services/api.js';
import { webSocketService } from '../services/websocket.js';
import { getToken } from '../services/api.js';

export const FriendGameView = async () => {
  const wrap = document.createElement('div');
  const user = getCurrentUser();

  if (!user) {
    wrap.innerHTML = `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
        <h2>Play vs Friend</h2>
        <p class="text-gray-400 text-sm">You must be logged in to play with friends.</p>
        <div class="flex items-start gap-5 mt-4 flex-wrap">
          <a href="/profile" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70">Login / Register</a>
          <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" data-link href="/home">Back</a>
        </div>
      </div>
    `;
    return wrap;
  }

  // Load friends
  let friends: any[] = [];
  try {
    const result = await userAPI.getFriends();
    friends = result.friends || [];
  } catch (err: any) {
    console.error('Error loading friends:', err);
  }

  wrap.innerHTML = `
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <h2>Play vs Friend</h2>
      <p class="text-gray-400 text-sm">Select a friend to play with or search for a user to add as a friend.</p>

      <div class="mt-5">
        <h3 class="mb-3">Your Friends</h3>
        <div id="friends-list" class="mb-5">
          ${friends.length === 0
            ? '<p class="text-gray-400 text-sm">No friends yet. Search for users below to add friends.</p>'
            : friends.map((f: any) => `
              <div class="p-3 border border-[#444] rounded-lg mb-2 flex justify-between items-center">
                <div>
                  <strong>${escapeHTML(f.display_name || f.username)}</strong>
                  <div class="text-xs text-gray-400">@${escapeHTML(f.username)}</div>
                </div>
                <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" data-friend-id="${f.id}" data-friend-name="${escapeHTML(f.display_name || f.username)}">Play</button>
              </div>
            `).join('')
          }
        </div>
      </div>

      <div class="mt-5 pt-5 border-t-2 border-t-[#444]">
        <h3 class="mb-3">Search & Add Friends</h3>
        <div class="flex gap-2 mb-3">
          <input type="text" id="search-username" class="rounded-xl border border-slate-400/45 bg-slate-900/90 text-gray-100 px-3 py-2 text-sm outline-none w-full transition-all duration-150 shadow-lg shadow-slate-900/75 focus:border-indigo-500 focus:shadow-indigo-500/90 focus:shadow-xl focus:-translate-y-px focus:bg-slate-900 flex-1" placeholder="Search by username...">
          <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70" id="search-btn">Search</button>
        </div>
        <div id="search-results"></div>
      </div>

      <div class="mt-5">
        <a class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap" data-link href="/home">Back</a>
      </div>
    </div>
  `;

  // Play with friend buttons
  wrap.querySelectorAll('[data-friend-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const friendId = (btn as HTMLElement).getAttribute('data-friend-id');
      const friendName = (btn as HTMLElement).getAttribute('data-friend-name');
      if (friendId && friendName) {
        await startGameWithFriend(friendId, friendName);
      }
    });
  });

  // Search functionality
  const searchBtn = wrap.querySelector('#search-btn') as HTMLButtonElement;
  const searchInput = wrap.querySelector('#search-username') as HTMLInputElement;
  const searchResults = wrap.querySelector('#search-results') as HTMLElement;

  searchBtn.onclick = async () => {
    const query = searchInput.value.trim();
    if (!query || query.length < 2) {
      searchResults.innerHTML = '<p class="text-gray-400 text-sm">Please enter at least 2 characters to search.</p>';
      return;
    }

    try {
      searchBtn.disabled = true;
      searchBtn.textContent = 'Searching...';

      // Search users (we'll need to implement this endpoint)
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const users = data.users || [];

      // Filter out current user and existing friends
      const friendIds = new Set(friends.map((f: any) => f.id));
      const filteredUsers = users.filter((u: any) =>
        u.id !== user.id && !friendIds.has(u.id)
      );

      if (filteredUsers.length === 0) {
        searchResults.innerHTML = '<p class="text-gray-400 text-sm">No users found.</p>';
      } else {
        searchResults.innerHTML = filteredUsers.map((u: any) => `
          <div class="p-3 border border-[#444] rounded-lg mb-2 flex justify-between items-center">
            <div>
              <strong>${escapeHTML(u.display_name || u.username)}</strong>
              <div class="text-xs text-gray-400">@${escapeHTML(u.username)}</div>
            </div>
            <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px" data-add-friend-id="${u.id}">Add Friend</button>
          </div>
        `).join('');

        // Add friend buttons
        searchResults.querySelectorAll('[data-add-friend-id]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const friendId = (btn as HTMLElement).getAttribute('data-add-friend-id');
            if (friendId) {
              await addFriend(friendId);
            }
          });
        });
      }
    } catch (err: any) {
      searchResults.innerHTML = `<p class="text-gray-400 text-sm text-[#f44]">Error: ${err.message || 'Search failed'}</p>`;
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Search';
    }
  };

  searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  };

  async function addFriend(friendId: string) {
    try {
      // Add friend API call
      const response = await fetch(`/api/users/me/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ friend_id: parseInt(friendId) })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to add friend' }));
        throw new Error(error.error || 'Failed to add friend');
      }

      alert('Friend added successfully!');
      // Reload the view
      navigate('/friend');
    } catch (err: any) {
      alert(err.message || 'Failed to add friend');
    }
  }

  async function startGameWithFriend(_friendId: string, friendName: string) {
    const token = getToken();
    if (!token) {
      alert('You must be logged in to play');
      return;
    }

    // Connect to WebSocket
    webSocketService.connect(token);

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Set up listener for game creation
    let gameId: string | null = null;
    const gameCreatedHandler = (gameState: any) => {
      if (gameState && gameState.id) {
        gameId = gameState.id;
      }
    };

    webSocketService.onGameStateUpdate(gameCreatedHandler);

    // Create game with friend (null check for user)
    if (!user) {
      alert('User session expired. Please log in again.');
      return;
    }

    webSocketService.createGame(
      user.display_name || user.username,
      friendName
    );

    // Wait for game to be created (with timeout)
    let attempts = 0;
    while (!gameId && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (gameId) {
      navigate(`/game/${gameId}`);
    } else {
      alert('Failed to create game. Please try again.');
    }

    // Clean up handler
    // Note: In a real implementation, you'd want to properly remove the handler
  }

  return wrap;
};
