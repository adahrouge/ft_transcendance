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

  try {
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
    });

    const google = (window as any).google;
    if (!google) {
      throw new Error('Google Sign-In library not loaded');
    }

    // Create the promise for getting the credential
    const credentialPromise = new Promise<any>((resolve, reject) => {
      const callbackName = `__google_sign_in_callback_${Date.now()}`;
      
      (window as any)[callbackName] = (response: any) => {
        delete (window as any)[callbackName];
        if (response && response.credential) {
          resolve(response);
        } else {
          reject(new Error('No credential received from Google'));
        }
      };

      // Initialize Google accounts if not already done
      if (!initialized) {
        google.accounts.id.initialize({
          client_id: googleConfig!.clientId,
          callback: (window as any)[callbackName],
          auto_select: false,
        });
        initialized = true;
      }

      // Render the standard Google Sign-In button and trigger it
      const containerDiv = document.createElement('div');
      containerDiv.style.display = 'none';
      document.body.appendChild(containerDiv);

      google.accounts.id.renderButton(containerDiv, {
        type: 'standard',
        size: 'large',
        theme: 'outline',
        text: 'signin',
      });

      // Find the button rendered by Google and click it
      setTimeout(() => {
        try {
          const button = containerDiv.querySelector('button') || 
                        containerDiv.querySelector('div[role="button"]');
          if (button) {
            (button as HTMLElement).click();
          }
        } catch (e) {
          console.warn('Could not click rendered button:', e);
        }

        // Clean up the container
        setTimeout(() => {
          try {
            document.body.removeChild(containerDiv);
          } catch (_) {}
        }, 100);
      }, 100);

      // Set timeout for response
      const responseTimeout = setTimeout(() => {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
          reject(new Error('Google sign-in timed out - no response from Google'));
        }
      }, 30000);

      // Clean up timeout when callback fires
      const originalCallback = (window as any)[callbackName];
      (window as any)[callbackName] = (response: any) => {
        clearTimeout(responseTimeout);
        originalCallback(response);
      };
    });

    // Return the credential promise
    return await credentialPromise;
  } finally {
    // Always reset the pending flag
    pendingRequest = false;
  }
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
