import { apiRequest } from "../api";

export const friendService = {
  async getFriends() {
    return apiRequest<{ friends: any[] }>('/api/users/me/friends');
  },

  async getPendingRequests() {
    return apiRequest<{ requests: any[] }>('/api/users/me/friend-requests');
  },

  async getSentRequests() {
    return apiRequest<{ requests: any[] }>('/api/users/me/friend-requests/sent');
  },

  async searchUsers(query: string) {
    return apiRequest<{ users: any[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  async sendFriendRequest(friendId: number) {
    return apiRequest('/api/users/me/friends/request', {
      method: 'POST',
      body: JSON.stringify({ friend_id: friendId }),
    });
  },

  async acceptFriendRequest(friendId: number) {
    return apiRequest('/api/users/me/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friend_id: friendId }),
    });
  },

  async rejectFriendRequest(friendId: number) {
    return apiRequest('/api/users/me/friends/reject', {
      method: 'POST',
      body: JSON.stringify({ friend_id: friendId }),
    });
  },

  async removeFriend(friendId: number) {
    return apiRequest(`/api/users/me/friends/${friendId}`, {
      method: 'DELETE',
    });
  },

  async blockUser(userId: number) {
    return apiRequest('/api/users/me/blocked', {
      method: 'POST',
      body: JSON.stringify({ blocked_user_id: userId }),
    });
  },

  async unblockUser(userId: number) {
    return apiRequest(`/api/users/me/blocked/${userId}`, {
      method: 'DELETE',
    });
  },

  async getBlockedUsers() {
    return apiRequest<{ blockedUsers: any[] }>('/api/users/me/blocked');
  }
};
