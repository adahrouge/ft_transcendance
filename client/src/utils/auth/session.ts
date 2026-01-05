const STORAGE_KEY = "is_logged_in";

export function setAuthenticated(value: boolean): void {
  if (value) {
    localStorage.setItem(STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}
