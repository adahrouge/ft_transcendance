import { xoBoardCustomizationService } from "../../services/boardCustomization";
import { XoBoardCustomization, DEFAULT_XO_CUSTOMIZATION, XO_THEME_PRESETS } from "../../types/boardCustomization";
import { i18n } from "../../services/i18n";
import { renderXoThemePresets, updateXoColorPickers, updateXoPreview, highlightActiveXoTheme } from "./xoRenderers";

export async function setupXoCustomization() {
  const customization = await xoBoardCustomizationService.loadCustomization();
  let currentCustomization: XoBoardCustomization = { ...customization };

  renderXoThemePresets();
  updateXoColorPickers(currentCustomization);
  updateXoPreview(currentCustomization);

  setupXoColorInputs(currentCustomization);
  setupXoSaveButton(currentCustomization);
  setupXoResetButton(() => currentCustomization);
  setupXoThemeButtons(() => currentCustomization);

  highlightActiveXoTheme(currentCustomization.theme);

  return { getCurrentCustomization: () => currentCustomization };
}

function setupXoColorInputs(currentCustomization: XoBoardCustomization) {
  const colorInputs = {
    background: document.getElementById("xo-color-background") as HTMLInputElement,
    grid: document.getElementById("xo-color-grid") as HTMLInputElement,
    xColor: document.getElementById("xo-color-x") as HTMLInputElement,
    oColor: document.getElementById("xo-color-o") as HTMLInputElement,
    border: document.getElementById("xo-color-border") as HTMLInputElement,
  };

  Object.entries(colorInputs).forEach(([key, input]) => {
    if (input) {
      input.addEventListener("input", () => {
        currentCustomization.colors[key as keyof typeof currentCustomization.colors] = input.value;
        currentCustomization.theme = "custom";
        updateXoPreview(currentCustomization);
        highlightActiveXoTheme(currentCustomization.theme);
      });
    }
  });
}

function setupXoSaveButton(currentCustomization: XoBoardCustomization) {
  const saveBtn = document.getElementById("xo-btn-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const success = await xoBoardCustomizationService.saveCustomization(currentCustomization);
      const statusEl = document.getElementById("xo-status-message");
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

function setupXoResetButton(getCurrentCustomization: () => XoBoardCustomization) {
  const resetBtn = document.getElementById("xo-btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const current = getCurrentCustomization();
      Object.assign(current, DEFAULT_XO_CUSTOMIZATION);
      updateXoColorPickers(current);
      updateXoPreview(current);
      highlightActiveXoTheme(current.theme);
    });
  }
}

function setupXoThemeButtons(getCurrentCustomization: () => XoBoardCustomization) {
  Object.keys(XO_THEME_PRESETS).forEach((themeName) => {
    const themeBtn = document.getElementById(`xo-theme-${themeName}`);
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = getCurrentCustomization();
        Object.assign(current, XO_THEME_PRESETS[themeName]);
        updateXoColorPickers(current);
        updateXoPreview(current);
        highlightActiveXoTheme(themeName);
      });
    }
  });
}
