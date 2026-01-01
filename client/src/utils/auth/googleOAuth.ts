import type { GoogleOAuthResponse } from "../../types/auth";

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

export function triggerGoogleSignIn(): Promise<GoogleOAuthResponse> {
  if (!isGoogleReady()) return Promise.reject(new Error('Google OAuth not configured'));

  return new Promise((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          try {
            console.log('Fetching user info with access token...');
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                'Authorization': `Bearer ${tokenResponse.access_token}`
              }
            });

            if (!userInfoResponse.ok) {
              const errorText = await userInfoResponse.text();
              console.error('UserInfo fetch failed:', errorText);
              throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
            }

            const userInfo = await userInfoResponse.json();
            console.log('User info received:', userInfo);

            if (!userInfo.email || !userInfo.sub) {
              console.error('Incomplete user info:', userInfo);
              throw new Error('Email or user ID missing from Google response');
            }

            resolve({
              credential: tokenResponse.access_token,
              userInfo: userInfo
            });
          } catch (error) {
            console.error('Error in access token flow:', error);
            reject(error);
          }
        } else if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
        } else {
          reject(new Error('No token received'));
        }
      },
    });

    try {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      reject(error);
    }
  });
}
