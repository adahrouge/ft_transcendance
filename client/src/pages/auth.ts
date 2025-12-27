import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { initializeGoogleOAuth, triggerGoogleSignIn, decodeGoogleToken, isGoogleOAuthConfigured } from "../utils/google-oauth";
import { i18n } from "../services/i18n";
import { showNotification } from "../utils/notifications";
import "../styles/auth.css";

let isSubmitting = false;

export function renderAuthPage(): string {
  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  if (googleClientId) {
    // Pre-load the Google script immediately
    initializeGoogleOAuth(googleClientId).catch(() => {});
  }

  setTimeout(() => {
    setupAuthInteractions();
  }, 0);

  return `
    <div class="auth-container">
      <div class="auth-overlay"></div>
      <div class="auth-box animate-fade-in">
        <div class="auth-header">
          <h1>TRANSCENDENCE</h1>
        </div>

        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">${i18n.t('login')}</button>
          <button class="tab-btn" data-tab="register">${i18n.t('register')}</button>
        </div>

        <div class="auth-form-container">
          <form id="login-form" class="auth-form active flex flex-col gap-4">
            <div class="form-group">
              <label for="login-username">${i18n.t('username')}</label>
              <input type="text" id="login-username" class="pixel-input" placeholder="${i18n.t('enter_username')}" required autocomplete="username">
            </div>
            <div class="form-group">
              <label for="login-password">${i18n.t('password')}</label>
              <input type="password" id="login-password" class="pixel-input" placeholder="${i18n.t('enter_password')}" required autocomplete="current-password">
            </div>
            <div id="login-error" class="error-message"></div>
            <button type="submit" class="submit-btn pixel-btn" id="login-submit">
              <span class="btn-text">${i18n.t('login')}</span>
              <span class="btn-loading hidden">
                <svg class="spinner" viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
                </svg>
              </span>
            </button>

            <div class="divider">${i18n.t('or')}</div>

            <button type="button" class="google-btn" id="google-login">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <span>${i18n.t('continue_with_google')}</span>
            </button>
          </form>

          <form id="register-form" class="auth-form hidden flex-col gap-4">
            <div class="form-group">
              <label for="register-username">${i18n.t('username')}</label>
              <input type="text" id="register-username" class="pixel-input" placeholder="${i18n.t('choose_username')}" required autocomplete="username" minlength="3" maxlength="20">
            </div>
            <div class="form-group">
              <label for="register-email">${i18n.t('email')}</label>
              <input type="email" id="register-email" class="pixel-input" placeholder="${i18n.t('enter_email')}" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="register-password">${i18n.t('password')}</label>
              <input type="password" id="register-password" class="pixel-input" placeholder="${i18n.t('create_password')}" required autocomplete="new-password" minlength="6">
            </div>
            <div id="register-error" class="error-message"></div>
            <button type="submit" class="submit-btn pixel-btn" id="register-submit">
              <span class="btn-text">${i18n.t('sign_up')}</span>
              <span class="btn-loading hidden">
                <svg class="spinner" viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
                </svg>
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function setButtonLoading(buttonId: string, loading: boolean) {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  if (!button) return;
  
  const btnText = button.querySelector('.btn-text') as HTMLElement;
  const btnLoading = button.querySelector('.btn-loading') as HTMLElement;
  
  if (loading) {
    button.disabled = true;
    btnText?.classList.add('hidden');
    btnLoading?.classList.remove('hidden');
  } else {
    button.disabled = false;
    btnText?.classList.remove('hidden');
    btnLoading?.classList.add('hidden');
  }
}

function setupAuthInteractions() {
  const tabs = document.querySelectorAll(".tab-btn");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (isSubmitting) return;
      
      const target = (tab as HTMLElement).dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      (tab as HTMLElement).classList.add("active");

      forms.forEach((form) => {
        if (form.id === `${target}-form`) {
          form.classList.remove("hidden");
          form.classList.add("flex");
        } else {
          form.classList.add("hidden");
          form.classList.remove("flex");
        }
      });
      
      // Clear any error messages
      const loginError = document.getElementById("login-error");
      const registerError = document.getElementById("register-error");
      if (loginError) loginError.textContent = '';
      if (registerError) registerError.textContent = '';
    });
  });

  const loginForm = document.getElementById("login-form") as HTMLFormElement;
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const usernameInput = document.getElementById("login-username") as HTMLInputElement;
    const passwordInput = document.getElementById("login-password") as HTMLInputElement;
    const errorDiv = document.getElementById("login-error");
    
    // Clear previous errors
    if (errorDiv) errorDiv.textContent = '';
    
    // Validate inputs
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
      if (errorDiv) errorDiv.textContent = i18n.t('fill_all_fields');
      return;
    }

    isSubmitting = true;
    setButtonLoading('login-submit', true);

    try {
      await authService.login({ username, password });
      showNotification('Login successful!', { type: 'success', duration: 2000 });
      navigateTo("/home");
    } catch (error) {
      const errorMessage = (error as Error).message || i18n.t('login_failed');
      if (errorDiv) errorDiv.textContent = errorMessage;
    } finally {
      isSubmitting = false;
      setButtonLoading('login-submit', false);
    }
  });

  const registerForm = document.getElementById("register-form") as HTMLFormElement;
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const usernameInput = document.getElementById("register-username") as HTMLInputElement;
    const emailInput = document.getElementById("register-email") as HTMLInputElement;
    const passwordInput = document.getElementById("register-password") as HTMLInputElement;
    const errorDiv = document.getElementById("register-error");
    
    // Clear previous errors
    if (errorDiv) errorDiv.textContent = '';
    
    // Validate inputs
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !email || !password) {
      if (errorDiv) errorDiv.textContent = i18n.t('fill_all_fields');
      return;
    }
    
    if (username.length < 3) {
      if (errorDiv) errorDiv.textContent = i18n.t('username_too_short');
      return;
    }

    if (username.length > 20) {
      if (errorDiv) errorDiv.textContent = i18n.t('username_too_long');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      if (errorDiv) errorDiv.textContent = i18n.t('username_invalid_chars');
      return;
    }
    
    if (password.length < 8) {
      if (errorDiv) errorDiv.textContent = i18n.t('password_too_short');
      return;
    }

    if (password.length > 64) {
      if (errorDiv) errorDiv.textContent = i18n.t('password_too_long');
      return;
    }

    if (!/[0-9]/.test(password)) {
      if (errorDiv) errorDiv.textContent = i18n.t('password_needs_number');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      if (errorDiv) errorDiv.textContent = i18n.t('password_needs_uppercase');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      if (errorDiv) errorDiv.textContent = i18n.t('password_needs_special');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (errorDiv) errorDiv.textContent = i18n.t('invalid_email');
      return;
    }

    isSubmitting = true;
    setButtonLoading('register-submit', true);

    try {
      await authService.register({ username, email, password });
      showNotification('Registration successful!', { type: 'success', duration: 2000 });
      navigateTo("/home");
    } catch (error) {
      const errorMessage = (error as Error).message || i18n.t('registration_failed');
      if (errorDiv) errorDiv.textContent = errorMessage;
    } finally {
      isSubmitting = false;
      setButtonLoading('register-submit', false);
    }
  });

  // Google Sign-In button handler
  const googleBtn = document.getElementById("google-login") as HTMLButtonElement;
  if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (!isGoogleOAuthConfigured()) {
        showNotification("Google OAuth not configured", { type: 'warning', duration: 5000 });
        return;
      }

      isSubmitting = true;
      googleBtn.disabled = true;
      googleBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24" width="18" height="18">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
        </svg>
        <span>Signing in...</span>
      `;

      try {
        const response = await triggerGoogleSignIn();

        if (response?.credential) {
          const userData = decodeGoogleToken(response.credential);
          const { email, name, sub: googleId } = userData;

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
            showNotification("Authentication failed. Please try again.", { type: 'error' });
          }
        }
      } catch (error) {
        const errorMsg = (error as Error).message;
        if (!errorMsg.includes('cancelled') && !errorMsg.includes('dismissed')) {
          showNotification(`Google authentication failed: ${errorMsg}`, { type: 'error' });
        }
      } finally {
        isSubmitting = false;
        googleBtn.disabled = false;
        googleBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          <span>${i18n.t('continue_with_google')}</span>
        `;
      }
    });
  }
}

