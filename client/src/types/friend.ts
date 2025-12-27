export interface Friend {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_online?: boolean;
}

export interface FriendRequest {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface BlockedUser {
  id: number;
  username: string;
  display_name?: string;
}

export interface SearchUser {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface FriendsResponse {
  friends: Friend[];
}

export interface FriendRequestsResponse {
  requests: FriendRequest[];
}

export interface BlockedUsersResponse {
  blockedUsers: BlockedUser[];
}

export interface SearchUsersResponse {
  users: SearchUser[];
}
