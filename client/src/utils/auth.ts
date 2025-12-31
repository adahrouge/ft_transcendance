import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import { showNotification } from "../utils/notifications";
import type { GoogleOAuthResponse, GoogleTokenPayload } from "../types/auth";

// ============ Token Management ============

const STORAGE_KEY_TOKEN = "auth_token";

export function getToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// ============ Google OAuth ============

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
    // Use OAuth2 with authorization code flow for better incognito support
    const client = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response: any) => {
        if (response.code) {
          // Exchange authorization code for ID token on backend
          // For now, we'll use the implicit flow instead
          reject(new Error('Code flow not implemented, using implicit flow'));
        } else if (response.error) {
          reject(new Error(response.error));
        }
      },
    });

    // Fallback: Use implicit flow with token client (works in incognito)
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          try {
            // Fetch user info using access token
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

            // Create a mock JWT credential with user info
            // Backend will verify with Google anyway, so we just need to pass the data
            resolve({
              credential: tokenResponse.access_token,
              userInfo: userInfo // Pass along for client-side use
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

    // Request token (opens popup)
    try {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      reject(error);
    }
  });
}

// ============ Form Setup ============

export function setupAuthPage() {
  setupTabs();
  setupLoginForm();
  setupRegisterForm();
  setupGoogleLogin();
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = (tab as HTMLElement).dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      forms.forEach((form) => {
        const isTarget = form.id === `${target}-form`;
        form.classList.toggle("hidden", !isTarget);
        form.classList.toggle("flex", isTarget);
      });

      document.getElementById("login-error")!.textContent = '';
      document.getElementById("register-error")!.textContent = '';
    });
  });
}

function setupLoginForm() {
  const form = document.getElementById("login-form") as HTMLFormElement;
  const errorDiv = document.getElementById("login-error")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';

    const username = (document.getElementById("login-username") as HTMLInputElement).value.trim();
    const password = (document.getElementById("login-password") as HTMLInputElement).value;

    if (!username || !password) {
      errorDiv.textContent = i18n.t('fill_all_fields');
      return;
    }

    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    btn.disabled = true;

    try {
      await authService.login({ username, password });
      showNotification('Login successful!', { type: 'success', duration: 2000 });
      navigateTo("/home");
    } catch (error) {
      errorDiv.textContent = (error as Error).message || i18n.t('login_failed');
    } finally {
      btn.disabled = false;
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById("register-form") as HTMLFormElement;
  const errorDiv = document.getElementById("register-error")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';

    const username = (document.getElementById("register-username") as HTMLInputElement).value.trim();
    const email = (document.getElementById("register-email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("register-password") as HTMLInputElement).value;

    const validationError = validateRegistration(username, email, password);
    if (validationError) {
      errorDiv.textContent = validationError;
      return;
    }

    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    btn.disabled = true;

    try {
      await authService.register({ username, email, password });
      showNotification('Registration successful!', { type: 'success', duration: 2000 });
      navigateTo("/home");
    } catch (error) {
      errorDiv.textContent = (error as Error).message || i18n.t('registration_failed');
    } finally {
      btn.disabled = false;
    }
  });
}

function setupGoogleLogin() {
  const btn = document.getElementById("google-login") as HTMLButtonElement;
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!isGoogleReady()) {
      showNotification("Google OAuth not configured", { type: 'warning' });
      return;
    }

    btn.disabled = true;

    try {
      const response = await triggerGoogleSignIn();
      if (response?.credential) {
        let email: string;
        let name: string;
        let googleId: string;

        // Check if we have userInfo directly (from access token flow)
        if ((response as any).userInfo) {
          const userInfo = (response as any).userInfo;
          console.log('Google userInfo:', userInfo);
          email = userInfo.email;
          name = userInfo.name || userInfo.given_name || email?.split('@')[0] || 'User';
          googleId = userInfo.sub;
        } else {
          // Try to decode as JWT ID token
          try {
            const base64Url = response.credential.split('.')[1];
            if (!base64Url) {
              throw new Error('Invalid token format');
            }

            // Convert base64url to base64 (replace URL-safe chars)
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload: GoogleTokenPayload = JSON.parse(atob(base64));

            console.log('Google token payload:', payload);
            email = payload.email;
            name = payload.name;
            googleId = payload.sub;
          } catch (decodeError) {
            console.error('Token decode error:', decodeError);
            throw new Error('Failed to decode authentication token');
          }
        }

        // Validate we have all required fields
        if (!email || !googleId) {
          console.error('Missing required Google auth data:', { email, name, googleId });
          throw new Error('Missing required user information from Google');
        }

        const result = await authService.googleAuth(
          response.credential,
          email,
          name,
          googleId
        );

        if (result?.token) {
          showNotification('Login successful!', { type: 'success', duration: 2000 });
          navigateTo("/home");
        } else {
          showNotification("Authentication failed", { type: 'error' });
        }
      }
    } catch (error) {
      const msg = (error as Error).message;
      if (!msg.includes('cancelled') && !msg.includes('dismissed')) {
        showNotification(`Google auth failed: ${msg}`, { type: 'error' });
      }
    } finally {
      btn.disabled = false;
    }
  });
}

// ============ Validation ============

function validateRegistration(username: string, email: string, password: string): string | null {
  if (!username || !email || !password) return i18n.t('fill_all_fields');
  if (username.length < 3) return i18n.t('username_too_short');
  if (username.length > 20) return i18n.t('username_too_long');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return i18n.t('username_invalid_chars');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return i18n.t('invalid_email');
  if (password.length < 8) return i18n.t('password_too_short');
  if (password.length > 64) return i18n.t('password_too_long');
  if (!/[0-9]/.test(password)) return i18n.t('password_needs_number');
  if (!/[A-Z]/.test(password)) return i18n.t('password_needs_uppercase');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return i18n.t('password_needs_special');
  return null;
}
