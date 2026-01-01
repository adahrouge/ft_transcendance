import type { UserProfile } from "../../types/home";
import defaultProfileImage from "../../assets/images/profile.png";

export const DEFAULT_AVATAR = defaultProfileImage;

interface AvatarUser {
  username: string;
  avatar_url?: string;
}

export function getAvatarUrl(user: UserProfile | AvatarUser): string {
  if (user.avatar_url && user.avatar_url.trim() !== "") {
    return user.avatar_url;
  }
  return DEFAULT_AVATAR;
}

export function getDisplayName(user: UserProfile): string {
  return user.display_name || user.username;
}
