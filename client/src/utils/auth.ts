const STORAGE_KEY_TOKEN = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
