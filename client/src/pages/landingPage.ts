import backgroundImage from "../assets/images/background.jpg";
import { startTypingAnimation } from "../utils/landingPage";
import { i18n } from "../services/i18n";
import "../styles/landingPage.css";

export function renderLandingPage(): string {
  setTimeout(() => {
    startTypingAnimation();
    setupLanguageSwitcher();
  }, 100);

  return `
    <div class="landing-container fixed inset-0 flex items-center justify-center overflow-hidden z-[9999]" style="background: url('${backgroundImage}') center/cover no-repeat;">
      <!-- Optional overlay for better text readability -->
      <div class="absolute inset-0 bg-black/20 pointer-events-none"></div>

      <!-- Language Switcher -->
      <div class="absolute top-4 right-4 z-50 flex gap-2">
        <button class="lang-btn ${i18n.getLanguage() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        <button class="lang-btn ${i18n.getLanguage() === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
        <button class="lang-btn ${i18n.getLanguage() === 'ar' ? 'active' : ''}" data-lang="ar">AR</button>
      </div>

      <div class="landing-content relative text-center p-10 animate-fade-in z-10 flex flex-col items-center justify-center gap-8">
        <div class="pixel-title mb-0">
          <div class="main-title text-[120px] md:text-[60px] sm:text-[44px] flex items-center justify-center gap-0 leading-none min-h-[120px] md:min-h-[60px] sm:min-h-[44px]" id="loading-text"></div>
        </div>
      </div>
      
      <div class="press-start" id="press-start">
        ${i18n.t('press_start')}
      </div>
    </div>
  `;
}

function setupLanguageSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (btn as HTMLElement).dataset.lang;
      if (lang) {
        i18n.setLanguage(lang as any);
      }
    });
  });
}
