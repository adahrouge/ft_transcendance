// Landing page with retro pixel art style and loading animation
import pixelGameRegular from '../assets/fonts/pixel-game.regular.otf';
import pixelGameExtrude from '../assets/fonts/pixel-game.extrude.otf';
import backgroundImage from '../assets/images/background.jpg';
import { navigate } from '../router.js';

export const LandingView = () => {
  console.log('Font paths:', { pixelGameRegular, pixelGameExtrude });
  const wrap = document.createElement('div');

  wrap.innerHTML = `
    <div class="landing-container">
      <div class="landing-content">
        <div class="pixel-title">
          <div class="title-line main-title" id="loading-text"></div>
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
    @font-face {
      font-family: 'Pixel Game';
      src: url('${pixelGameRegular}') format('opentype');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'Pixel Game Extrude';
      src: url('${pixelGameExtrude}') format('opentype');
      font-weight: normal;
      font-style: normal;
    }

    .landing-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        url('${backgroundImage}') center/cover no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      overflow: hidden;
    }

    /* Optional overlay for better text readability */
    .landing-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.2);
      pointer-events: none;
    }

    .landing-content {
      position: relative;
      text-align: center;
      padding: 40px;
      animation: fadeIn 0.8s ease-out;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
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
      margin-bottom: 0;
    }

    .main-title {
      font-size: 120px;
      letter-spacing: normal;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      line-height: 1;
      min-height: 120px;
    }

    .main-title span {
      display: inline-block;
      position: relative;
      font-family: 'Pixel Game';
      z-index: 1;
      color: #70c9e8;
      text-shadow:
        0 0 5px rgba(112, 201, 232, 0.5),
        0 0 10px rgba(112, 201, 232, 0.3);
      animation: letterPop 0.4s ease-out forwards;
    }

    .main-title span::after {
      content: attr(data-text);
      position: absolute;
      left: 3px;
      top: 3px;
      font-family: 'Pixel Game Extrude';
      z-index: -1;
      color: #2c6b87;
      text-shadow:
        0 0 8px rgba(44, 107, 135, 0.3);
    }

    @keyframes letterPop {
      0% {
        transform: translateY(20px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .press-start {
      font-family: 'Press Start 2P', monospace;
      font-size: 24px;
      color: #5db3d1;
      cursor: pointer;
      transition: all 0.3s ease;
      text-shadow:
        0 0 5px rgba(93, 179, 209, 0.3);
      animation: fadeInOut 2s ease-in-out infinite;
      pointer-events: none;
    }

    .press-start:hover {
      color: #7ec9e0;
      text-shadow:
        0 0 8px rgba(126, 201, 224, 0.5);
    }

    @keyframes fadeInOut {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.3;
      }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .main-title {
        font-size: 44px;
        letter-spacing: 4px;
        min-height: 44px;
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
      const span = document.createElement('span');
      span.textContent = text.charAt(index);
      span.setAttribute('data-text', text.charAt(index));
      span.className = `letter-${index}`;
      loadingTextEl.appendChild(span);
      index++;
      // Faster typing for better feel
      setTimeout(typeWriter, 100);
    } else {
      // Show "PRESS TO START" after typing is complete
      setTimeout(() => {
        pressStartEl.style.opacity = '1';
        pressStartEl.style.pointerEvents = 'auto';
        pressStartEl.style.animation = 'fadeIn 1s ease-in, pulse 2s ease-in-out infinite';
      }, 300);
    }
  };

  // Start typing animation after a brief delay
  setTimeout(typeWriter, 500);

  // Click handler to proceed to login
  const handleClick = () => {
    // Mark that user has seen landing
    sessionStorage.setItem('hasSeenLanding', 'true');

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
      // Navigate to auth page
      navigate('/auth');
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
