// Global error handling

export function initErrorHandling() {
  window.addEventListener('error', (e) => {
    console.error('Unhandled error:', (e as ErrorEvent).error || (e as ErrorEvent).message);
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', (e as PromiseRejectionEvent).reason);
  });
}
