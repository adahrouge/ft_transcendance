import { setupHomePage } from "../utils/home";
import { renderProfileBar, renderGameButtons } from "../components/home";
import "../styles/home.css";

export function renderHomePage(): string {
  setTimeout(setupHomePage, 0);

  return `
    <div class="home-container">
      <div class="home-overlay"></div>
      <div class="home-content">
        <div id="home-main" class="flex flex-col gap-4 w-full max-w-[500px]">
          ${renderProfileBar()}
          ${renderGameButtons()}
        </div>
      </div>
    </div>
  `;
}
