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
  return googleConfig !== null && (window as any).google !== undefined;
}

export async function triggerGoogleSignIn(): Promise<any> {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('Google OAuth not configured');
  }

  return new Promise((resolve, reject) => {
    try {
      (window as any).google.accounts.id.initialize({
        client_id: googleConfig!.clientId,
        use_fedcm_for_prompt: false,
        callback: (response: any) => {
          if (response.credential) {
            resolve(response);
          } else {
            reject(new Error('No credential in response'));
          }
        },
      });

      // Render the sign-in button
      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        }
      );

      // Also try One Tap prompt as fallback
      setTimeout(() => {
        try {
          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // One Tap not shown, button is already rendered above
            }
          });
        } catch {
          // One Tap not available, button is fallback
        }
      }, 500);

    } catch (error) {
      reject(error);
    }
  });
}

export function decodeGoogleToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch {
    return null;
  }
}
