import { i18n } from "../../services/i18n";
import { createTabButtons } from "./tabButtons";
import { createPongPanel } from "./pongPanel";
import { createXoPanel } from "./xoPanel";

export function createCustomizeBoardBox(): string {
  return `
    <div class="customize-board-box">
      <h1 class="customize-board-title">${i18n.t('customize_board')}</h1>
      <p class="customize-board-subtitle">${i18n.t('personalize_board')}</p>

      ${createTabButtons()}
      ${createPongPanel()}
      ${createXoPanel()}
    </div>
  `;
}
