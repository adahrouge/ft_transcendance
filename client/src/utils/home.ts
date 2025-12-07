import type { UserProfile } from "../types/home";

interface AvatarUser {
  username: string;
  avatar_url?: string;
}

export function getAvatarUrl(user: UserProfile | AvatarUser): string {
  if (user.avatar_url) {
    return user.avatar_url;
  }
  return generateDefaultAvatar(user.username);
}

export function generateDefaultAvatar(username: string): string {
  // Generate a simple SVG avatar with initials
  const initial = username.charAt(0).toUpperCase();
  const colors = ["#3d8aa8", "#2c6b87", "#4a9dc0", "#1a4558", "#70c9e8"];
  const colorIndex = username.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}"/>
      <text x="50" y="50" font-family="monospace" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

export function getDisplayName(user: UserProfile): string {
  return user.display_name || user.username;
}
