import { authService } from "../../services/auth";
import { navigateTo } from "../../router";
import { i18n } from "../../services/i18n";
import { showNotification } from "../notifications";
import { isGoogleReady, triggerGoogleSignIn } from "./googleOAuth";
import { validateRegistration } from "./validation";

export function setupAuthPage() {
  setupTabs();
  setupLoginForm();
  setupRegisterForm();
  setupGoogleLogin();
  setupPasswordToggles();
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
      const userInfo = await triggerGoogleSignIn();
      const result = await authService.googleAuth(userInfo);

      if (result?.user) {
        showNotification('Login successful!', { type: 'success', duration: 2000 });
        navigateTo("/home");
      } else {
        showNotification("Authentication failed", { type: 'error' });
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

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId!) as HTMLInputElement;
      const eyeIcon = button.querySelector('.eye-icon');
      const eyeOffIcon = button.querySelector('.eye-off-icon');

      if (input && eyeIcon && eyeOffIcon) {
        if (input.type === 'password') {
          input.type = 'text';
          eyeIcon.classList.add('hidden');
          eyeOffIcon.classList.remove('hidden');
        } else {
          input.type = 'password';
          eyeIcon.classList.remove('hidden');
          eyeOffIcon.classList.add('hidden');
        }
      }
    });
  });
}
