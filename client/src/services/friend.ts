import { apiRequest } from "../api";

export const friendService = {
  async getFriends() {
    return apiRequest<{ friends: any[] }>('/api/users/me/friends');
  },
  
  async searchUsers(query: string) {
    return apiRequest<{ users: any[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
  },
  
  async addFriend(friendId: number) {
    return apiRequest('/api/users/me/friends', {
      method: 'POST',
      body: JSON.stringify({ friend_id: friendId }),
    });
  }
};
