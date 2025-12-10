import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { initializeGoogleOAuth, triggerGoogleSignIn, decodeGoogleToken, isGoogleOAuthConfigured } from "../utils/google-oauth";
import "../styles/auth.css";
import backgroundImage from "../assets/images/background.jpg";

export function renderAuthPage(): string {
  // Initialize Google OAuth with client ID from environment
  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  if (googleClientId) {
    initializeGoogleOAuth(googleClientId);
  }

  setTimeout(() => {
    setupAuthInteractions();
  }, 0);

  return `
    <div class="auth-container" style="background-image: url('${backgroundImage}')">
      <div class="auth-overlay"></div>
      <div class="auth-box animate-fade-in">
        <div class="auth-header">
          <h1>TRANSCENDENCE</h1>
        </div>

        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">LOGIN</button>
          <button class="tab-btn" data-tab="register">REGISTER</button>
        </div>

        <div class="auth-form-container">
          <form id="login-form" class="auth-form active flex flex-col gap-4">
            <div class="form-group">
              <label for="login-username">USERNAME</label>
              <input type="text" id="login-username" class="pixel-input" placeholder="Enter username" required>
            </div>
            <div class="form-group">
              <label for="login-password">PASSWORD</label>
              <input type="password" id="login-password" class="pixel-input" placeholder="Enter password" required>
            </div>
            <div id="login-error" class="error-message"></div>
            <button type="submit" class="submit-btn pixel-btn">LOGIN</button>

            <div class="divider">OR</div>

            <button type="button" class="google-btn" id="google-login">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>
          </form>

          <form id="register-form" class="auth-form hidden flex-col gap-4">
            <div class="form-group">
              <label for="register-username">USERNAME</label>
              <input type="text" id="register-username" class="pixel-input" placeholder="Choose username" required>
            </div>
            <div class="form-group">
              <label for="register-email">EMAIL</label>
              <input type="email" id="register-email" class="pixel-input" placeholder="Enter email" required>
            </div>
            <div class="form-group">
              <label for="register-password">PASSWORD</label>
              <input type="password" id="register-password" class="pixel-input" placeholder="Create password" required>
            </div>
            <div id="register-error" class="error-message"></div>
            <button type="submit" class="submit-btn pixel-btn">SIGN UP</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function setupAuthInteractions() {
  const tabs = document.querySelectorAll(".tab-btn");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
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
    });
  });

  const loginForm = document.getElementById("login-form") as HTMLFormElement;
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById(
      "login-username"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "login-password"
    ) as HTMLInputElement;
    const errorDiv = document.getElementById("login-error");

    try {
      await authService.login({
        username: usernameInput.value,
        password: passwordInput.value,
      });
      navigateTo("/home");
    } catch (error) {
      if (errorDiv)
        errorDiv.textContent = "Login failed. Please check your credentials.";
      console.error(error);
    }
  });

  const registerForm = document.getElementById(
    "register-form"
  ) as HTMLFormElement;
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById(
      "register-username"
    ) as HTMLInputElement;
    const emailInput = document.getElementById(
      "register-email"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "register-password"
    ) as HTMLInputElement;
    const errorDiv = document.getElementById("register-error");

    try {
      await authService.register({
        username: usernameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
      });
      navigateTo("/home");
    } catch (error) {
      if (errorDiv)
        errorDiv.textContent = "Registration failed. Please try again.";
      console.error(error);
    }
  });

  // Google Sign-In button handler
  const googleBtn = document.getElementById("google-login") as HTMLButtonElement;
  if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("Google button clicked");

      if (!isGoogleOAuthConfigured()) {
        alert("⚠️ Google OAuth not configured.\n\nTo enable Google Sign-In:\n\n1. Get a Google Client ID from https://console.cloud.google.com/\n2. Create client/.env.local with:\n   VITE_GOOGLE_CLIENT_ID=your_client_id_here\n3. Restart the app");
        return;
      }

      try {
        console.log("Triggering Google Sign-In...");
        // Trigger Google Sign-In
        const response = await triggerGoogleSignIn();
        console.log("Google Sign-In response:", response);
        
        if (response && response.credential) {
          console.log("Got credential, decoding...");
          // Decode the JWT to get user information
          const userData = decodeGoogleToken(response.credential);
          console.log("User data:", userData);
          const { email, name, sub: googleId } = userData;

          console.log("Sending to backend...");
          // Call the backend Google auth endpoint
          const result = await authService.googleAuth(
            response.credential,
            email,
            name,
            googleId
          );

          console.log("Backend response:", result);
          console.log("Token stored:", localStorage.getItem("auth_token") ? "Yes" : "No");
          
          if (result && result.token) {
            console.log("Token received, waiting before redirect...");
            // Small delay to ensure token is set
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log("Redirecting to home...");
            navigateTo("/home");
          } else {
            console.error("No token in result:", result);
            alert("Authentication succeeded but no token received. Please try again.");
          }
        } else {
          console.error("No credential in response:", response);
          alert("Failed to authenticate with Google. Please try again.");
        }
      } catch (error) {
        console.error("Google Sign-In error:", error);
        alert(`Google authentication failed: ${(error as Error).message}`);
      }
    });
  }
}

