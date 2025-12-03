// Centered login/signup page with modern purple theme
import { navigate } from '../router.js';
import { authAPI } from '../services/api.js';
import { setCurrentUser } from '../utils/user.js';
import backgroundImage from '../assets/images/background.jpg';

export const AuthView = () => {
  const wrap = document.createElement('div');

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
      background: url('${backgroundImage}') center/cover no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-y: auto;
    }

    /* Dark overlay for better readability */
    .auth-container::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: none;
      z-index: 1;
    }

    .auth-box {
      position: relative;
      z-index: 2;
      background: rgba(0, 0, 0, 0.7);
      border: 3px solid #70c9e8;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow:
        0 0 40px rgba(112, 201, 232, 0.3),
        0 10px 40px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .pixel-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 24px;
      color: #70c9e8;
      text-shadow:
        0 0 10px rgba(112, 201, 232, 0.5),
        0 0 20px rgba(112, 201, 232, 0.3);
      margin-bottom: 15px;
      letter-spacing: 2px;
    }

    .auth-subtitle {
      font-family: 'VT323', monospace;
      font-size: 20px;
      color: #5db3d1;
      letter-spacing: 2px;
      text-shadow: 0 0 10px rgba(93, 179, 209, 0.5);
    }

    .auth-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 30px;
    }

    .tab-btn {
      flex: 1;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 15px;
      background: rgba(112, 201, 232, 0.1);
      border: 2px solid #2c6b87;
      border-radius: 12px;
      color: #70c9e8;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 1px;
    }

    .tab-btn:hover {
      background: rgba(112, 201, 232, 0.2);
      border-color: #70c9e8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(112, 201, 232, 0.3);
    }

    .tab-btn.active {
      background: #70c9e8;
      color: #000;
      border-color: #a8d8ea;
      box-shadow: 0 0 20px rgba(112, 201, 232, 0.5);
    }

    .auth-forms {
      position: relative;
    }

    .auth-form {
      display: none;
    }

    .auth-form.active {
      display: block;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: #70c9e8;
      margin-bottom: 10px;
      letter-spacing: 1px;
      text-shadow: 0 0 5px rgba(112, 201, 232, 0.3);
    }

    .form-group input {
      width: 100%;
      padding: 14px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #2c6b87;
      border-radius: 10px;
      color: #fff;
      font-family: 'VT323', monospace;
      font-size: 18px;
      transition: all 0.2s ease;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .form-group input:focus {
      outline: none;
      border-color: #70c9e8;
      box-shadow:
        0 0 20px rgba(112, 201, 232, 0.4),
        inset 0 2px 4px rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.7);
    }

    .form-group input::placeholder {
      color: #5db3d1;
      opacity: 0.5;
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
      padding: 18px;
      background: #70c9e8;
      border: 3px solid #a8d8ea;
      border-radius: 12px;
      color: #000;
      font-family: 'Press Start 2P', monospace;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 2px;
      box-shadow:
        0 0 20px rgba(112, 201, 232, 0.5),
        0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .submit-btn:hover {
      background: #a8d8ea;
      border-color: #70c9e8;
      box-shadow:
        0 0 30px rgba(112, 201, 232, 0.8),
        0 8px 20px rgba(0, 0, 0, 0.4);
      transform: translateY(-3px);
    }

    .submit-btn:active {
      transform: translateY(-1px);
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
      navigate('/home');
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
      navigate('/home');
    } catch (err: any) {
      errorEl.textContent = err.message || 'Registration failed';
      submitBtn.classList.remove('loading');
    }
  });
}
