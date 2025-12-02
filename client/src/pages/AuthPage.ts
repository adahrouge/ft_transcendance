// Centered login/signup page with modern purple theme
import { navigate } from '../router.js';
import { authAPI } from '../services/api.js';
import { setCurrentUser } from '../utils/user.js';

export const AuthView = () => {
  const wrap = document.createElement('div');

  // Hide navbar when auth page is shown
  const header = document.querySelector('header');
  if (header) {
    (header as HTMLElement).style.display = 'none';
  }

  wrap.innerHTML = `
    <div class="auth-container">
      <div class="auth-box">
        <div class="auth-header">
          <h1 class="pixel-title">TRANSCENDENCE</h1>
          <p class="auth-subtitle">Enter the Arena</p>
        </div>

        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">LOGIN</button>
          <button class="tab-btn" data-tab="signup">SIGN UP</button>
        </div>

        <div class="auth-forms">
          <!-- Login Form -->
          <form id="login-form" class="auth-form active">
            <div class="form-group">
              <label for="login-username">USERNAME</label>
              <input type="text" id="login-username" placeholder="Enter username" required autocomplete="username">
            </div>
            <div class="form-group">
              <label for="login-password">PASSWORD</label>
              <input type="password" id="login-password" placeholder="Enter password" required autocomplete="current-password">
            </div>
            <div id="login-error" class="error-message"></div>
            <button type="submit" class="submit-btn">
              <span class="btn-text">LOGIN</span>
            </button>
          </form>

          <!-- Signup Form -->
          <form id="signup-form" class="auth-form">
            <div class="form-group">
              <label for="signup-username">USERNAME</label>
              <input type="text" id="signup-username" placeholder="Choose username" required autocomplete="username">
            </div>
            <div class="form-group">
              <label for="signup-email">EMAIL</label>
              <input type="email" id="signup-email" placeholder="Enter email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="signup-display-name">DISPLAY NAME</label>
              <input type="text" id="signup-display-name" placeholder="Display name (optional)" autocomplete="name">
            </div>
            <div class="form-group">
              <label for="signup-password">PASSWORD</label>
              <input type="password" id="signup-password" placeholder="Choose password" required autocomplete="new-password">
            </div>
            <div id="signup-error" class="error-message"></div>
            <button type="submit" class="submit-btn">
              <span class="btn-text">SIGN UP</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .auth-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15), transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(22, 163, 74, 0.20), transparent 45%),
        radial-gradient(circle at 50% 50%, #000000, #0a0f0a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-y: auto;
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Scanline effect */
    .auth-container::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        );
      pointer-events: none;
      z-index: 1;
    }

    .auth-box {
      position: relative;
      z-index: 2;
      background: rgba(0, 0, 0, 0.8);
      border: 3px solid #22c55e;
      border-radius: 0;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow:
        0 0 20px rgba(34, 197, 94, 0.3),
        inset 0 0 30px rgba(34, 197, 94, 0.05);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .pixel-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 24px;
      color: #22c55e;
      text-shadow:
        0 0 10px rgba(34, 197, 94, 0.8),
        0 0 20px rgba(34, 197, 94, 0.4),
        2px 2px 0px rgba(0, 0, 0, 0.8);
      margin-bottom: 15px;
      letter-spacing: 2px;
    }

    .auth-subtitle {
      font-family: 'VT323', monospace;
      font-size: 20px;
      color: #10b981;
      letter-spacing: 2px;
    }

    .auth-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 30px;
      border: 2px solid #22c55e;
    }

    .tab-btn {
      flex: 1;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: #10b981;
      cursor: pointer;
      transition: all 0.3s ease;
      letter-spacing: 1px;
    }

    .tab-btn:hover {
      background: rgba(34, 197, 94, 0.1);
    }

    .tab-btn.active {
      background: #22c55e;
      color: #000000;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
    }

    .auth-forms {
      position: relative;
    }

    .auth-form {
      display: none;
      animation: slideIn 0.3s ease-out;
    }

    .auth-form.active {
      display: block;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: #22c55e;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }

    .form-group input {
      width: 100%;
      padding: 12px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid #16a34a;
      color: #22c55e;
      font-family: 'VT323', monospace;
      font-size: 18px;
      transition: all 0.3s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
      background: rgba(0, 0, 0, 0.8);
    }

    .form-group input::placeholder {
      color: #16a34a;
      opacity: 0.6;
    }

    .error-message {
      font-family: 'VT323', monospace;
      font-size: 16px;
      color: #ef4444;
      margin-bottom: 15px;
      min-height: 20px;
      text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
    }

    .submit-btn {
      width: 100%;
      padding: 15px;
      background: #22c55e;
      border: 3px solid #16a34a;
      color: #000000;
      font-family: 'Press Start 2P', monospace;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      letter-spacing: 2px;
      position: relative;
      overflow: hidden;
    }

    .submit-btn:hover {
      background: #16a34a;
      box-shadow:
        0 0 20px rgba(34, 197, 94, 0.6),
        inset 0 0 20px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .submit-btn:active {
      transform: translateY(0);
    }

    .submit-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .submit-btn:hover::before {
      width: 300px;
      height: 300px;
    }

    .btn-text {
      position: relative;
      z-index: 1;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .auth-box {
        padding: 25px;
      }

      .pixel-title {
        font-size: 18px;
      }

      .auth-subtitle {
        font-size: 16px;
      }

      .tab-btn {
        font-size: 10px;
        padding: 12px;
      }

      .form-group label {
        font-size: 8px;
      }

      .submit-btn {
        font-size: 12px;
      }
    }

    /* Loading state */
    .submit-btn.loading {
      pointer-events: none;
      opacity: 0.6;
    }

    .submit-btn.loading .btn-text::after {
      content: '...';
      animation: dots 1.5s steps(3, end) infinite;
    }

    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60%, 100% { content: '...'; }
    }
  `;
  document.head.appendChild(style);

  // Setup tab switching
  setTimeout(() => {
    const tabBtns = wrap.querySelectorAll('.tab-btn');
    const forms = wrap.querySelectorAll('.auth-form');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');

        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        forms.forEach(form => {
          form.classList.remove('active');
          if (form.id === `${tab}-form`) {
            form.classList.add('active');
          }
        });

        // Clear errors
        wrap.querySelectorAll('.error-message').forEach(el => {
          (el as HTMLElement).textContent = '';
        });
      });
    });

    setupLoginForm(wrap);
    setupSignupForm(wrap);
  }, 0);

  return wrap;
};

function setupLoginForm(wrap: HTMLElement) {
  const loginForm = wrap.querySelector('#login-form') as HTMLFormElement;
  const errorEl = wrap.querySelector('#login-error') as HTMLElement;
  const submitBtn = loginForm.querySelector('.submit-btn') as HTMLButtonElement;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const username = (loginForm.querySelector('#login-username') as HTMLInputElement).value;
    const password = (loginForm.querySelector('#login-password') as HTMLInputElement).value;

    // Add loading state
    submitBtn.classList.add('loading');

    try {
      const data = await authAPI.login(username, password);
      setCurrentUser(data.user);
      // Navigate to home after successful login
      navigate('/');
    } catch (err: any) {
      errorEl.textContent = err.message || 'Login failed';
      submitBtn.classList.remove('loading');
    }
  });
}

function setupSignupForm(wrap: HTMLElement) {
  const signupForm = wrap.querySelector('#signup-form') as HTMLFormElement;
  const errorEl = wrap.querySelector('#signup-error') as HTMLElement;
  const submitBtn = signupForm.querySelector('.submit-btn') as HTMLButtonElement;

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const username = (signupForm.querySelector('#signup-username') as HTMLInputElement).value;
    const email = (signupForm.querySelector('#signup-email') as HTMLInputElement).value;
    const displayName = (signupForm.querySelector('#signup-display-name') as HTMLInputElement).value;
    const password = (signupForm.querySelector('#signup-password') as HTMLInputElement).value;

    // Add loading state
    submitBtn.classList.add('loading');

    try {
      const data = await authAPI.register(username, email, password, displayName || undefined);
      setCurrentUser(data.user);
      // Navigate to home after successful registration
      navigate('/');
    } catch (err: any) {
      errorEl.textContent = err.message || 'Registration failed';
      submitBtn.classList.remove('loading');
    }
  });
}
