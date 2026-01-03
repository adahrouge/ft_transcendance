export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // Send cookies with request
  });

  const data = await response.json().catch(() => ({ error: "Unknown error" }));

  if (response.status === 401) {
    // If unauthorized and not trying to login/register, redirect to auth
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
