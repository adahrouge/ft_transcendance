import { getToken } from "../utils/auth";

class PresenceService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private statusChangeCallbacks: Set<(friendId: number, isOnline: boolean) => void> = new Set();
  private isConnecting = false;

  connect() {
    if (this.ws || this.isConnecting) {
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('No token available for presence connection');
      return;
    }

    this.isConnecting = true;

    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '3001'; // Backend port
    const wsUrl = `${protocol}//${host}:${port}/api/presence`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Presence WebSocket connected');
        this.isConnecting = false;
        
        // Authenticate
        if (this.ws) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'authenticated') {
            console.log('Presence authenticated:', data.userId);
          } else if (data.type === 'friend_statuses_initial') {
            // Handle initial friend statuses
            console.log('Received initial friend statuses:', data.statuses);
            data.statuses.forEach((status: { friendId: number; isOnline: boolean }) => {
              this.statusChangeCallbacks.forEach(callback => {
                callback(status.friendId, status.isOnline);
              });
            });
          } else if (data.type === 'friend_status_change') {
            // Notify all registered callbacks
            console.log('Friend status changed:', data.friendId, data.isOnline);
            this.statusChangeCallbacks.forEach(callback => {
              callback(data.friendId, data.isOnline);
            });
          } else if (data.type === 'error') {
            console.error('Presence error:', data.message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Presence WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('Presence WebSocket closed');
        this.ws = null;
        this.isConnecting = false;
        
        // Attempt to reconnect after 3 seconds
        this.reconnectTimeout = setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.connect();
        }, 3000);
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onStatusChange(callback: (friendId: number, isOnline: boolean) => void) {
    this.statusChangeCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusChangeCallbacks.delete(callback);
    };
  }
}

export const presenceService = new PresenceService();
