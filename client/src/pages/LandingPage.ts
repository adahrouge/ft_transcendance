// Landing page with retro pixel art style and loading animation
export const LandingView = () => {
  const wrap = document.createElement('div');

  wrap.innerHTML = `
    <div class="landing-container">
      <div class="landing-content">
        <div class="pixel-title">
          <div class="title-line main-title">
            <span id="loading-text"></span>
            <span class="cursor">_</span>
          </div>
        </div>
        <div class="press-start" id="press-start" style="opacity: 0;">
          PRESS TO START
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .landing-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      overflow: hidden;
    }

    .landing-content {
      text-align: center;
      padding: 40px;
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .pixel-title {
      font-family: 'Press Start 2P', monospace;
      color: #ffffff;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      margin-bottom: 60px;
    }

    .main-title {
      font-size: 48px;
      letter-spacing: 8px;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .cursor {
      animation: blink 1s step-end infinite;
      color: #ffffff;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .press-start {
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 20px 40px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      animation: pulse 2s ease-in-out infinite;
    }

    .press-start:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.6);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .main-title {
        font-size: 24px;
        letter-spacing: 4px;
      }

      .press-start {
        font-size: 12px;
        padding: 15px 30px;
      }
    }
  `;
  document.head.appendChild(style);

  // Typing animation for "TRANSCENDENCE"
  const text = "TRANSCENDENCE";
  const loadingTextEl = wrap.querySelector('#loading-text') as HTMLElement;
  const pressStartEl = wrap.querySelector('#press-start') as HTMLElement;
  let index = 0;

  const typeWriter = () => {
    if (index < text.length) {
      loadingTextEl.textContent += text.charAt(index);
      index++;
      // Random delay between 100-200ms for more retro feel
      setTimeout(typeWriter, 100 + Math.random() * 100);
    } else {
      // Show "PRESS TO START" after typing is complete
      setTimeout(() => {
        pressStartEl.style.opacity = '1';
        pressStartEl.style.animation = 'fadeIn 1s ease-in, pulse 2s ease-in-out infinite';
      }, 500);
    }
  };

  // Start typing animation after a brief delay
  setTimeout(typeWriter, 500);

  // Click handler to proceed to login
  const handleClick = () => {
    // Fade out animation
    wrap.querySelector('.landing-container')?.classList.add('fade-out');

    // Add fade out style
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
      .fade-out {
        animation: fadeOut 0.8s ease-out forwards;
      }

      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: scale(0.95);
        }
      }
    `;
    document.head.appendChild(fadeOutStyle);

    setTimeout(() => {
      // Dispatch custom event to show login form
      window.dispatchEvent(new CustomEvent('landing-complete'));
    }, 800);
  };

  // Add click listener to the press start button
  setTimeout(() => {
    pressStartEl.addEventListener('click', handleClick);
    // Also allow clicking anywhere after text is loaded
    wrap.querySelector('.landing-container')?.addEventListener('click', () => {
      if (index >= text.length && pressStartEl.style.opacity === '1') {
        handleClick();
      }
    });
  }, 0);

  return wrap;
};
