const STORAGE_KEY_TOKEN = "auth_token";

export function getToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
