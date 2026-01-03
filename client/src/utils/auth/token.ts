const STORAGE_KEY_LOGGED_IN = "is_logged_in";

export function getToken(): string | null {
  return null;
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEY_LOGGED_IN, "true");
  } else {
    localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
  }
}

export function setAuthenticated(isAuthenticated: boolean): void {
  if (isAuthenticated) {
    localStorage.setItem(STORAGE_KEY_LOGGED_IN, "true");
  } else {
    localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
  }
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY_LOGGED_IN) === "true";
}
