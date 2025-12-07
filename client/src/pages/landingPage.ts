import backgroundImage from "../assets/images/background.jpg";
import { startTypingAnimation } from "../utils/landingPage";
import "../styles/landingPage.css";

export function renderLandingPage(): string {
  setTimeout(() => {
    startTypingAnimation();
  }, 100);

  return `
    <div class="landing-container fixed inset-0 flex items-center justify-center overflow-hidden z-[9999]" style="background: url('${backgroundImage}') center/cover no-repeat;">
      <!-- Optional overlay for better text readability -->
      <div class="absolute inset-0 bg-black/20 pointer-events-none"></div>

      <div class="landing-content relative text-center p-10 animate-fade-in z-10 flex flex-col items-center justify-center gap-8">
        <div class="pixel-title mb-0">
          <div class="main-title text-[120px] md:text-[60px] sm:text-[44px] flex items-center justify-center gap-0 leading-none min-h-[120px] md:min-h-[60px] sm:min-h-[44px]" id="loading-text"></div>
        </div>
      </div>
      
      <div class="press-start" id="press-start">
        PRESS TO START
      </div>
    </div>
  `;
}
