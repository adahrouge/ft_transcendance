export function getWebSocketUrl(): string {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || '';

  if (apiUrl) {
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/api/tictactoe/matchmaking`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = '3001';
  return `${protocol}//${host}:${port}/api/tictactoe/matchmaking`;
}

export function getApiUrl(): string {
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
}
