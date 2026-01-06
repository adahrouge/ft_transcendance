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
    this.connect();
  }

  private getWebSocketUrl(): string {
    return `wss://${window.location.host}/api/presence`;
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.getWebSocketUrl());

      this.socket.onopen = () => {
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'authenticated':
              // console.log('Presence authenticated for user:', data.userId);
              break;

            case 'friend_statuses_initial':
              this.initialStatusesListeners.forEach(listener => {
                listener(data.statuses);
              });
              break;

            case 'friend_status_change':
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

  onFriendStatusChange(listener: PresenceListener) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  onInitialStatuses(listener: InitialStatusesListener) {
    this.initialStatusesListeners.push(listener);

    return () => {
      const index = this.initialStatusesListeners.indexOf(listener);
      if (index > -1) {
        this.initialStatusesListeners.splice(index, 1);
      }
    };
  }

  onFriendEvent(listener: FriendEventListener) {
    this.friendEventListeners.push(listener);

    return () => {
      const index = this.friendEventListeners.indexOf(listener);
      if (index > -1) {
        this.friendEventListeners.splice(index, 1);
      }
    };
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export const presenceService = new PresenceService();
