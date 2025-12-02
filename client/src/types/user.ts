export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
