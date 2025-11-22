// src/views/Friend.ts
import { navigate } from '../router.js';
import { getCurrentUser } from '../user-state.js';
import { escapeHTML } from '../utils.js';
import { userAPI } from '../api.js';
import { webSocketService } from '../websocket-service.js';
import { getToken } from '../api.js';

export const FriendGameView = async () => {
  const wrap = document.createElement('div');
  const user = getCurrentUser();
  
  if (!user) {
    wrap.innerHTML = `
      <div class="card">
        <h2>Play vs Friend</h2>
        <p class="muted">You must be logged in to play with friends.</p>
        <div class="row" style="margin-top:16px;">
          <a href="/profile" data-link class="btn primary">Login / Register</a>
          <a class="btn" data-link href="/">Back</a>
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
  } catch (err) {
    console.error('Error loading friends:', err);
  }

  wrap.innerHTML = `
    <div class="card">
      <h2>Play vs Friend</h2>
      <p class="muted">Select a friend to play with or search for a user to add as a friend.</p>
      
      <div style="margin-top:20px;">
        <h3 style="margin-bottom:12px;">Your Friends</h3>
        <div id="friends-list" style="margin-bottom:20px;">
          ${friends.length === 0 
            ? '<p class="muted">No friends yet. Search for users below to add friends.</p>'
            : friends.map((f: any) => `
              <div style="padding:12px; border:1px solid #444; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${escapeHTML(f.display_name || f.username)}</strong>
                  <div style="font-size:12px; color:#aaa;">@${escapeHTML(f.username)}</div>
                </div>
                <button class="btn primary" data-friend-id="${f.id}" data-friend-name="${escapeHTML(f.display_name || f.username)}">Play</button>
              </div>
            `).join('')
          }
        </div>
      </div>

      <div style="margin-top:20px; padding-top:20px; border-top:2px solid #444;">
        <h3 style="margin-bottom:12px;">Search & Add Friends</h3>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <input type="text" id="search-username" class="input-field" placeholder="Search by username..." style="flex:1;">
          <button class="btn primary" id="search-btn">Search</button>
        </div>
        <div id="search-results"></div>
      </div>

      <div style="margin-top:20px;">
        <a class="btn" data-link href="/">Back</a>
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
      searchResults.innerHTML = '<p class="muted">Please enter at least 2 characters to search.</p>';
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
        searchResults.innerHTML = '<p class="muted">No users found.</p>';
      } else {
        searchResults.innerHTML = filteredUsers.map((u: any) => `
          <div style="padding:12px; border:1px solid #444; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${escapeHTML(u.display_name || u.username)}</strong>
              <div style="font-size:12px; color:#aaa;">@${escapeHTML(u.username)}</div>
            </div>
            <button class="btn outline" data-add-friend-id="${u.id}">Add Friend</button>
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
      searchResults.innerHTML = `<p class="muted" style="color:#f44;">Error: ${err.message || 'Search failed'}</p>`;
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

  async function startGameWithFriend(friendId: string, friendName: string) {
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
    
    // Create game with friend
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

