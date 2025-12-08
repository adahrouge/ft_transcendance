import type { UserProfile } from "../types/home";
import defaultProfileImage from "../assets/images/profile.png";

interface AvatarUser {
  username: string;
  avatar_url?: string;
}

export function getAvatarUrl(user: ProfileUser | AvatarUser): string {
  // Only use avatar_url if it's a valid non-empty string
  if (user.avatar_url && user.avatar_url.trim() !== "") {
    return user.avatar_url;
  }
  return DEFAULT_AVATAR;
}

export const DEFAULT_AVATAR = defaultProfileImage;

// Type alias for compatibility
type ProfileUser = UserProfile;

export function getDisplayName(user: UserProfile): string {
  return user.display_name || user.username;
}
