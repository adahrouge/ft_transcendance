import { startTypingAnimation } from "../utils/landingPage";
import "../styles/landingPage.css";

export function renderLandingPage(): string {
  setTimeout(() => {
    startTypingAnimation();
  }, 100);

  return `
    <div class="landing-container">
      <div class="landing-overlay"></div>
      <div class="main-title" id="loading-text"></div>
      <div class="press-start" id="press-start">PRESS TO START</div>
    </div>
  `;
}
