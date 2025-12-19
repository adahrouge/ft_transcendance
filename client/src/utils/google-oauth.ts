// Google OAuth Configuration - Fast and reliable implementation

export interface GoogleOAuthConfig {
  clientId: string;
}

let googleConfig: GoogleOAuthConfig | null = null;
let scriptLoaded = false;
let scriptLoading = false;
let initPromise: Promise<void> | null = null;

export function initializeGoogleOAuth(clientId: string): Promise<void> {
  if (!clientId) return Promise.resolve();
  
  googleConfig = { clientId };
  
  // Return existing promise if script is already loading
  if (initPromise) return initPromise;
  
  // If already loaded, resolve immediately
  if (scriptLoaded && (window as any).google) {
    return Promise.resolve();
  }
  
  initPromise = new Promise<void>((resolve, reject) => {
    if (scriptLoading) {
      // Wait for existing script to load
      const checkLoaded = setInterval(() => {
        if ((window as any).google) {
          clearInterval(checkLoaded);
          scriptLoaded = true;
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error('Google Sign-In script load timeout'));
      }, 10000);
      return;
    }
    
    scriptLoading = true;
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      scriptLoading = false;
      initPromise = null;
      reject(new Error('Failed to load Google Sign-In script'));
    };
    
    document.head.appendChild(script);
  });
  
  return initPromise;
}

export function getGoogleConfig(): GoogleOAuthConfig | null {
  return googleConfig;
}

export function isGoogleOAuthConfigured(): boolean {
  return googleConfig !== null && googleConfig.clientId !== '';
}

// Fast Google Sign-In using popup
export async function triggerGoogleSignIn(): Promise<any> {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('Google OAuth not configured');
  }

  // Ensure script is loaded
  await initializeGoogleOAuth(googleConfig!.clientId);
  
  const google = (window as any).google;
  if (!google?.accounts?.id) {
    throw new Error('Google Sign-In library not available');
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Google sign-in timed out'));
    }, 60000);

    try {
      google.accounts.id.initialize({
        client_id: googleConfig!.clientId,
        callback: (response: any) => {
          clearTimeout(timeoutId);
          if (response?.credential) {
            resolve(response);
          } else {
            reject(new Error('No credential received'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true, // Enable FedCM for future compatibility
      });

      // Use prompt() for the One Tap UI which is faster
      google.accounts.id.prompt((notification: any) => {
        // Check if prompt was displayed or needs fallback
        const notDisplayed = notification.isNotDisplayed && notification.isNotDisplayed();
        const skipped = notification.isSkippedMoment && notification.isSkippedMoment();
        const dismissed = notification.isDismissedMoment && notification.isDismissedMoment();
        
        if (notDisplayed) {
          // If One Tap isn't displayed, fall back to button click
          fallbackToButtonFlow(google, resolve, reject, timeoutId);
        } else if (skipped) {
          // User closed the prompt
          clearTimeout(timeoutId);
          reject(new Error('Sign-in was cancelled'));
        } else if (dismissed) {
          const reason = notification.getDismissedReason && notification.getDismissedReason();
          if (reason === 'credential_returned') {
            // Success - callback will be triggered
          } else {
            clearTimeout(timeoutId);
            reject(new Error('Sign-in dismissed'));
          }
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

function fallbackToButtonFlow(
  google: any,
  resolve: (value: any) => void,
  reject: (reason: any) => void,
  timeoutId: ReturnType<typeof setTimeout>
) {
  // Create a hidden container for the button
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.zIndex = '99999';
  container.style.background = 'white';
  container.style.padding = '20px';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  document.body.appendChild(container);

  // Re-initialize with the callback
  google.accounts.id.initialize({
    client_id: googleConfig!.clientId,
    callback: (response: any) => {
      clearTimeout(timeoutId);
      container.remove();
      if (response?.credential) {
        resolve(response);
      } else {
        reject(new Error('No credential received'));
      }
    },
  });

  google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    width: 280,
  });

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'position:absolute;top:5px;right:10px;border:none;background:none;font-size:18px;cursor:pointer;color:#666;';
  closeBtn.onclick = () => {
    clearTimeout(timeoutId);
    container.remove();
    reject(new Error('Sign-in cancelled'));
  };
  container.appendChild(closeBtn);
}

// Decode Google JWT token to extract user info
export function decodeGoogleToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = parts[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding Google token:', error);
    throw error;
  }
}
