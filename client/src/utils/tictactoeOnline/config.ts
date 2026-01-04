export function getWebSocketUrl(): string {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || '';

  if (apiUrl) {
    // Use relative URL to go through Vite proxy (which preserves cookies)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}/api/tictactoe/matchmaking`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = '3001';
  return `${protocol}//${host}:${port}/api/tictactoe/matchmaking`;
}

export function getApiUrl(): string {
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
}
