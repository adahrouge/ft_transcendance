export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    method: options.method || 'GET',
    body: options.body,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({ error: "Unknown error" }));
  if (response.status === 401) {
    if (!endpoint.includes('/login') && !endpoint.includes('/register')) {
      localStorage.removeItem("is_logged_in");
      window.location.href = '/auth';
    }
  }
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data as T;
}