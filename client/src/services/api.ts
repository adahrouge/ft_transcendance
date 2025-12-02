// API service for backend communication
import { API_BASE_URL } from '../constants/api.js';
import { STORAGE_KEYS } from '../constants/storage.js';

// Get auth token from localStorage
export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

// Set auth token in localStorage
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

// API request helper
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type if there's a body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Auth API
export const authAPI = {
  async register(username: string, email: string, password: string, displayName?: string) {
    const data = await apiRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, display_name: displayName }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },
  
  async login(username: string, password: string) {
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },
  
  logout() {
    setAuthToken(null);
  },
  
  isAuthenticated(): boolean {
    return !!getToken();
  },
};

// User API
export const userAPI = {
  async getProfile() {
    return apiRequest('/api/users/me');
  },
  
  async updateProfile(updates: {
    display_name?: string;
    email?: string;
    avatar_url?: string;
    password?: string;
    current_password?: string;
  }) {
    return apiRequest('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  async getMatchHistory() {
    return apiRequest('/api/users/me/match-history');
  },
  
  async getFriends() {
    return apiRequest('/api/users/me/friends');
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it with boundary for FormData
    
    const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  },
};

// Game API
export const gameAPI = {
  async getActiveGames() {
    return apiRequest('/api/games');
  },
  
  async getGame(gameId: string) {
    return apiRequest(`/api/games/${gameId}`);
  },
};

// Tournament API
export const tournamentAPI = {
  async createTournament(maxPlayers: 4 | 8) {
    return apiRequest('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify({ max_players: maxPlayers }),
    });
  },
  
  async getActiveTournaments() {
    return apiRequest('/api/tournaments/active');
  },
  
  async getTournament(tournamentId: number) {
    return apiRequest(`/api/tournaments/${tournamentId}`);
  },
  
  async joinTournament(tournamentId: number) {
    return apiRequest(`/api/tournaments/${tournamentId}/join`, {
      method: 'POST',
    });
  },
  
  async fillTournamentWithBots(tournamentId: number) {
    return apiRequest(`/api/tournaments/${tournamentId}/fill-bots`, {
      method: 'POST',
      // No body needed - Fastify route accepts empty body
    });
  },
  
  async startTournament(tournamentId: number) {
    return apiRequest(`/api/tournaments/${tournamentId}/start`, {
      method: 'POST',
    });
  },
  
  async deleteTournament(tournamentId: number) {
    return apiRequest(`/api/tournaments/${tournamentId}`, {
      method: 'DELETE',
    });
  },
};

