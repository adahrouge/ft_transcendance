import { getToken } from "../utils/auth";

type PresenceListener = (friendId: number, isOnline: boolean) => void;
type InitialStatusesListener = (statuses: { friendId: number; isOnline: boolean }[]) => void;
type FriendEventListener = (event: FriendEvent) => void;

export interface FriendEvent {
  type: 'friend_request_received' | 'friend_request_accepted' | 'friend_request_rejected' | 'friend_removed' | 'user_blocked' | 'user_unblocked';
  from: {
    id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

class PresenceService {
  private socket: WebSocket | null = null;
  private listeners: PresenceListener[] = [];
  private initialStatusesListeners: InitialStatusesListener[] = [];
  private friendEventListeners: FriendEventListener[] = [];
  private reconnectTimeout: number | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    // Auto-connect on creation
    this.connect();
  }

  private getWebSocketUrl(): string {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '';

    if (apiUrl) {
      // Convert http(s):// to ws(s)://
      const wsUrl = apiUrl.replace(/^http/, 'ws');
      return `${wsUrl}/api/presence`;
    }

    // Fallback: use current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '3001';
    return `${protocol}//${host}:${port}/api/presence`;
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.getWebSocketUrl());

      this.socket.onopen = () => {
        console.log('Presence WebSocket connected');
        this.isConnecting = false;

        // Authenticate
        const token = getToken();
        if (token && this.socket) {
          this.socket.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'authenticated':
              console.log('Presence authenticated for user:', data.userId);
              break;

            case 'friend_statuses_initial':
              // Initial batch of friend statuses
              this.initialStatusesListeners.forEach(listener => {
                listener(data.statuses);
              });
              break;

            case 'friend_status_change':
              // A friend's status changed
              this.listeners.forEach(listener => {
                listener(data.friendId, data.isOnline);
              });
              break;

            case 'friend_request_received':
            case 'friend_request_accepted':
            case 'friend_request_rejected':
            case 'friend_removed':
            case 'user_blocked':
            case 'user_unblocked':
              // Friend-related events
              this.friendEventListeners.forEach(listener => {
                listener(data as FriendEvent);
              });
              break;

            case 'error':
              console.error('Presence error:', data.message);
              break;
          }
        } catch (err) {
          console.error('Failed to parse presence message:', err);
        }
      };

      this.socket.onclose = () => {
        console.log('Presence WebSocket closed');
        this.isConnecting = false;
        this.socket = null;

        // Reconnect after 3 seconds if should reconnect
        if (this.shouldReconnect) {
          this.reconnectTimeout = window.setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.socket.onerror = (err) => {
        console.error('Presence WebSocket error:', err);
        this.isConnecting = false;
      };
    } catch (err) {
      console.error('Failed to create presence WebSocket:', err);
      this.isConnecting = false;
    }
  }

  disconnect() {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Listen to friend status changes
  onFriendStatusChange(listener: PresenceListener) {
    this.listeners.push(listener);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Listen to initial friend statuses
  onInitialStatuses(listener: InitialStatusesListener) {
    this.initialStatusesListeners.push(listener);

    // Return cleanup function
    return () => {
      const index = this.initialStatusesListeners.indexOf(listener);
      if (index > -1) {
        this.initialStatusesListeners.splice(index, 1);
      }
    };
  }

  // Listen to friend events (requests, accepts, rejects, removals)
  onFriendEvent(listener: FriendEventListener) {
    this.friendEventListeners.push(listener);

    // Return cleanup function
    return () => {
      const index = this.friendEventListeners.indexOf(listener);
      if (index > -1) {
        this.friendEventListeners.splice(index, 1);
      }
    };
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const presenceService = new PresenceService();
