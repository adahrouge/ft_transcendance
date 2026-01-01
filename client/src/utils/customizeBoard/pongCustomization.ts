import { boardCustomizationService } from "../../services/boardCustomization";
import { BoardCustomization, DEFAULT_CUSTOMIZATION, THEME_PRESETS } from "../../types/boardCustomization";
import { i18n } from "../../services/i18n";
import { renderPongThemePresets, updatePongColorPickers, updatePongPreview, highlightActivePongTheme } from "./pongRenderers";

export async function setupPongCustomization() {
  const customization = await boardCustomizationService.loadCustomization();
  let currentCustomization: BoardCustomization = { ...customization };

  renderPongThemePresets();
  updatePongColorPickers(currentCustomization);
  updatePongPreview(currentCustomization);

  setupPongColorInputs(currentCustomization);
  setupPongSaveButton(currentCustomization);
  setupPongResetButton(() => currentCustomization);
  setupPongThemeButtons(() => currentCustomization);

  highlightActivePongTheme(currentCustomization.theme);

  return { getCurrentCustomization: () => currentCustomization };
}

function setupPongColorInputs(currentCustomization: BoardCustomization) {
  const colorInputs = {
    background: document.getElementById("pong-color-background") as HTMLInputElement,
    paddle: document.getElementById("pong-color-paddle") as HTMLInputElement,
    ball: document.getElementById("pong-color-ball") as HTMLInputElement,
    border: document.getElementById("pong-color-border") as HTMLInputElement,
    centerLine: document.getElementById("pong-color-centerline") as HTMLInputElement,
  };

  Object.entries(colorInputs).forEach(([key, input]) => {
    if (input) {
      input.addEventListener("input", () => {
        currentCustomization.colors[key as keyof typeof currentCustomization.colors] = input.value;
        currentCustomization.theme = "custom";
        updatePongPreview(currentCustomization);
        highlightActivePongTheme(currentCustomization.theme);
      });
    }
  });
}

function setupPongSaveButton(currentCustomization: BoardCustomization) {
  const saveBtn = document.getElementById("pong-btn-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const success = await boardCustomizationService.saveCustomization(currentCustomization);
      const statusEl = document.getElementById("pong-status-message");
      if (statusEl) {
        if (success) {
          statusEl.textContent = i18n.t('customization_saved');
          statusEl.style.color = "#4ade80";
        } else {
          statusEl.textContent = i18n.t('save_failed');
          statusEl.style.color = "#f87171";
        }
        setTimeout(() => {
          statusEl.textContent = "";
        }, 3000);
      }
    });
  }
}

function setupPongResetButton(getCurrentCustomization: () => BoardCustomization) {
  const resetBtn = document.getElementById("pong-btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const current = getCurrentCustomization();
      Object.assign(current, DEFAULT_CUSTOMIZATION);
      updatePongColorPickers(current);
      updatePongPreview(current);
      highlightActivePongTheme(current.theme);
    });
  }
}

function setupPongThemeButtons(getCurrentCustomization: () => BoardCustomization) {
  Object.keys(THEME_PRESETS).forEach((themeName) => {
    const themeBtn = document.getElementById(`pong-theme-${themeName}`);
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = getCurrentCustomization();
        Object.assign(current, THEME_PRESETS[themeName]);
        updatePongColorPickers(current);
        updatePongPreview(current);
        highlightActivePongTheme(themeName);
      });
    }
  });
}
