import { setupCustomizeBoard } from "../utils/customizeBoard";
import { createCustomizeBoardBox } from "../components/customizeBoard";
import "../styles/customizeBoard.css";

export function renderCustomizeBoardPage(): string {
  setTimeout(setupCustomizeBoard, 0);

  return `
    <div class="customize-board-container">
      <div class="customize-board-overlay"></div>
      <div class="customize-board-content">
        ${createCustomizeBoardBox()}
      </div>
    </div>
  `;
}

