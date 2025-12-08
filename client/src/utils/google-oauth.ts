// Google OAuth Configuration
// This file manages Google Sign-In integration

export interface GoogleOAuthConfig {
  clientId: string;
}

let googleConfig: GoogleOAuthConfig | null = null;
let scriptLoaded = false;
let initialized = false;
let pendingRequest = false;

export function initializeGoogleOAuth(clientId: string) {
  googleConfig = { clientId };
  
  // Load Google Sign-In library if not already loaded
  if (!scriptLoaded) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      scriptLoaded = true;
    });
    script.addEventListener('error', () => {
      scriptLoaded = false;
    });
    document.head.appendChild(script);
  }
}

export function getGoogleConfig(): GoogleOAuthConfig | null {
  return googleConfig;
}

export function isGoogleOAuthConfigured(): boolean {
  return googleConfig !== null && googleConfig.clientId !== '';
}

// Helper function to trigger Google Sign-In with pop-up
export async function triggerGoogleSignIn(): Promise<any> {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.');
  }
  if (pendingRequest) {
    throw new Error('Another Google sign-in is already in progress');
  }

  pendingRequest = true;

  // Wait for the script to load
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Google Sign-In script load timeout')), 5000);
    if ((window as any).google) {
      clearTimeout(timeout);
      resolve();
      return;
    }
    const check = () => {
      if ((window as any).google) {
        clearTimeout(timeout);
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }).catch((err) => {
    pendingRequest = false;
    throw err;
  });

  const google = (window as any).google;
  if (!google) {
    pendingRequest = false;
    throw new Error('Google Sign-In library not loaded');
  }

  return await new Promise((resolve, reject) => {
    const tempCallbackName = `__google_sign_in_callback_${Date.now()}`;
    (window as any)[tempCallbackName] = (response: any) => {
      delete (window as any)[tempCallbackName];
      pendingRequest = false;
      resolve(response);
    };

    try {
      if (!initialized) {
        google.accounts.id.initialize({
          client_id: googleConfig!.clientId,
          callback: (window as any)[tempCallbackName],
        });
        initialized = true;
      }

      // Render a temporary button and click it to open the popup (avoids FedCM path)
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      google.accounts.id.renderButton(tempDiv, {
        type: 'standard',
        size: 'large',
        theme: 'outline',
      });

      // Try to click the button element; if GSI uses iframe, clicking might not be needed.
      setTimeout(() => {
        try {
          const button = tempDiv.querySelector('button');
          if (button) (button as HTMLElement).click();
        } catch (e) {
          // ignore
        }
      }, 50);

      // Clean up after some time
      setTimeout(() => {
        try { document.body.removeChild(tempDiv); } catch (_) {}
      }, 5000);

      // Also set a safety timeout
      setTimeout(() => {
        if ((window as any)[tempCallbackName]) {
          delete (window as any)[tempCallbackName];
          pendingRequest = false;
          reject(new Error('Google sign-in timed out'));
        }
      }, 20000);
    } catch (error) {
      delete (window as any)[tempCallbackName];
      pendingRequest = false;
      reject(error);
    }
  });
}

// Decode Google JWT token to extract user info
export function decodeGoogleToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Pad the token if needed
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    
    return JSON.parse(atob(padded));
  } catch (error) {
    console.error('Error decoding Google token:', error);
    throw error;
  }
}
