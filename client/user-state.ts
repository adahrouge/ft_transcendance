// src/user-state.ts - User state management with persistence

import { authAPI, userAPI } from './api.js';

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

let currentUser: User | null = null;
let userListeners: ((user: User | null) => void)[] = [];

// Load user from token on initialization
export async function initUserState() {
  if (authAPI.isAuthenticated()) {
    try {
      const response = await userAPI.getProfile();
      currentUser = response.user;
      notifyListeners();
    } catch (err) {
      console.error('Failed to load user profile:', err);
      // Token might be invalid, clear it
      authAPI.logout();
      currentUser = null;
      notifyListeners();
    }
  }
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null) {
  currentUser = user;
  notifyListeners();
}

export function subscribeToUser(callback: (user: User | null) => void) {
  userListeners.push(callback);
  // Immediately call with current user
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {
    userListeners = userListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  userListeners.forEach(callback => callback(currentUser));
}

// Get default avatar URL (using a placeholder service or data URL)
export function getDefaultAvatar(username: string): string {
  // Generate a colored circle avatar based on username
  const colors = ['#5e81f4', '#3b7af2', '#4caf50', '#ff9800', '#e74c3c', '#9b59b6'];
  const index = username.charCodeAt(0) % colors.length;
  const color = colors[index];
  const initial = username.charAt(0).toUpperCase();
  
  // Create a data URL for a simple colored circle with initial
  const size = 40;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Draw circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw initial
  ctx.fillStyle = '#fff';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, size / 2, size / 2);
  
  return canvas.toDataURL();
}

export function getUserAvatar(user: User | null): string {
  if (!user) return getDefaultAvatar('User');
  if (user.avatar_url) return user.avatar_url;
  return getDefaultAvatar(user.username);
}

