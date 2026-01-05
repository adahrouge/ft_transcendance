export interface GoogleUserInfo {
  email: string;
  name: string;
  googleId: string;
  accessToken: string;
}

let googleClientId: string | null = null;
let googleScriptLoaded = false;

export function initGoogleOAuth(clientId: string): Promise<void> {
  if (!clientId) return Promise.resolve();
  googleClientId = clientId;

  if (googleScriptLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => { googleScriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

export function isGoogleReady(): boolean {
  return googleClientId !== null && (window as any).google !== undefined;
}

export function triggerGoogleSignIn(): Promise<GoogleUserInfo> {
  if (!isGoogleReady()) return Promise.reject(new Error('Google OAuth not configured'));

  return new Promise((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
            });

            if (!res.ok) throw new Error(`Failed to fetch user info: ${res.status}`);

            const userInfo = await res.json();
            if (!userInfo.email || !userInfo.sub) {
              throw new Error('Email or user ID missing from Google response');
            }

            resolve({
              email: userInfo.email,
              name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
              googleId: userInfo.sub,
              accessToken: tokenResponse.access_token
            });
          } catch (error) {
            reject(error);
          }
        } else if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
        } else {
          reject(new Error('No token received'));
        }
      },
      error_callback: (error: any) => {
        reject(new Error(error?.message || 'popup_closed'));
      },
    });

    try {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      reject(error);
    }
  });
}
