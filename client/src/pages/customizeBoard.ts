import { navigateTo } from "../router";
import { isAuthenticated, getToken } from "../utils/auth";
import { i18n } from "../services/i18n";
import { onlineGameService } from "../services/onlineGame";
import { boardCustomizationService } from "../services/boardCustomization";
import { BoardCustomization, DEFAULT_CUSTOMIZATION, THEME_PRESETS } from "../types/boardCustomization";
import "../styles/customizeBoard.css";
import backgroundImage from "../assets/images/background.jpg";

export function renderCustomizeBoardPage(): string {
  setTimeout(() => {
    setupCustomizeBoard();
  }, 0);

  return `
    <div class="customize-board-container" style="background-image: url('${backgroundImage}')">
      <div class="customize-board-overlay"></div>
      <div class="customize-board-content">
        <div class="customize-board-box">
          <h1 class="customize-board-title">${i18n.t('customize_board')}</h1>
          <p class="customize-board-subtitle">${i18n.t('personalize_board')}</p>

          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Controls Section -->
            <div class="flex-1 order-2 lg:order-1">
              <!-- Theme Presets -->
              <div class="mb-6">
                <h3 class="customize-board-section-title">${i18n.t('theme_presets')}</h3>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-3" id="theme-presets"></div>
              </div>

              <!-- Color Customization -->
              <div class="mb-4">
                <h3 class="customize-board-section-title">${i18n.t('custom_colors')}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div class="flex flex-col gap-1">
                    <label class="customize-board-label text-xs">${i18n.t('background')}</label>
                    <input type="color" id="color-background" class="customize-board-color-input w-full h-8">
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="customize-board-label text-xs">${i18n.t('paddle')}</label>
                    <input type="color" id="color-paddle" class="customize-board-color-input w-full h-8">
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="customize-board-label text-xs">${i18n.t('ball')}</label>
                    <input type="color" id="color-ball" class="customize-board-color-input w-full h-8">
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="customize-board-label text-xs">${i18n.t('border')}</label>
                    <input type="color" id="color-border" class="customize-board-color-input w-full h-8">
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="customize-board-label text-xs">${i18n.t('center_line')}</label>
                    <input type="color" id="color-centerline" class="customize-board-color-input w-full h-8">
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview Section -->
            <div class="flex-1 flex flex-col items-center order-1 lg:order-2">
              <h3 class="customize-board-section-title w-full text-center lg:text-left">${i18n.t('preview')}</h3>
              <div class="customize-board-preview-container mb-6">
                <canvas id="preview-canvas" width="300" height="300" class="rounded-lg shadow-2xl max-w-full"></canvas>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 flex-wrap justify-center w-full">
                <button class="customize-board-btn-secondary text-sm px-3 py-2" id="btn-reset">${i18n.t('reset_default')}</button>
                <button class="customize-board-btn text-sm px-6 py-2" id="btn-save">${i18n.t('save')}</button>
                <button class="customize-board-btn-secondary text-sm px-3 py-2" id="btn-back">${i18n.t('back')}</button>
              </div>
              
              <div id="status-message" class="customize-board-status mt-4 text-center h-6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function setupCustomizeBoard() {
  if (!isAuthenticated()) {
    navigateTo("/auth");
    return;
  }

  // Load current customization
  const customization = await boardCustomizationService.loadCustomization();
  let currentCustomization: BoardCustomization = { ...customization };

  // Render theme presets
  renderThemePresets(currentCustomization);

  // Initialize color pickers
  updateColorPickers(currentCustomization);

  // Initialize preview
  updatePreview(currentCustomization);

  // Add event listeners for color pickers
  const colorInputs = {
    background: document.getElementById("color-background") as HTMLInputElement,
    paddle: document.getElementById("color-paddle") as HTMLInputElement,
    ball: document.getElementById("color-ball") as HTMLInputElement,
    border: document.getElementById("color-border") as HTMLInputElement,
    centerLine: document.getElementById("color-centerline") as HTMLInputElement,
  };

  Object.entries(colorInputs).forEach(([key, input]) => {
    if (input) {
      input.addEventListener("input", () => {
        currentCustomization.colors[key as keyof typeof currentCustomization.colors] = input.value;
        currentCustomization.theme = "custom";
        updatePreview(currentCustomization);
        highlightActiveTheme(currentCustomization.theme);
      });
    }
  });

  // Save button
  const saveBtn = document.getElementById("btn-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const success = await boardCustomizationService.saveCustomization(currentCustomization);
      const statusEl = document.getElementById("status-message");
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

  // Reset button
  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentCustomization = { ...DEFAULT_CUSTOMIZATION };
      updateColorPickers(currentCustomization);
      updatePreview(currentCustomization);
      highlightActiveTheme(currentCustomization.theme);
    });
  }

  // Back button
  const backBtn = document.getElementById("btn-back");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      navigateTo("/home");
    });
  }

  // Theme preset click handlers
  function setupThemePresetHandlers(customization: BoardCustomization) {
    Object.keys(THEME_PRESETS).forEach((themeName) => {
      const themeBtn = document.getElementById(`theme-${themeName}`);
      if (themeBtn) {
        themeBtn.addEventListener("click", () => {
          currentCustomization = { ...THEME_PRESETS[themeName] };
          updateColorPickers(currentCustomization);
          updatePreview(currentCustomization);
          highlightActiveTheme(themeName);
        });
      }
    });
  }

  setupThemePresetHandlers(currentCustomization);
  highlightActiveTheme(currentCustomization.theme);

  // Connect to WebSocket to register as online
  const token = getToken();
  if (token) {
    onlineGameService.connect(token);
  }
}

function renderThemePresets(_currentCustomization: BoardCustomization) {
  const presetsContainer = document.getElementById("theme-presets");
  if (!presetsContainer) return;

  const themeNames = Object.keys(THEME_PRESETS);
  presetsContainer.innerHTML = themeNames.map((themeName) => {
    const theme = THEME_PRESETS[themeName];
    const displayName = (i18n as any).t(themeName) || themeName.charAt(0).toUpperCase() + themeName.slice(1);

    return `
      <button class="customize-board-preset-btn" id="theme-${themeName}" data-theme="${themeName}">
        <div class="w-full aspect-square rounded-md relative mb-2 overflow-hidden" style="background: ${theme.colors.background};">
          <div class="absolute top-2 left-2 right-2 bottom-2 rounded-sm" style="border: 2px solid ${theme.colors.border};"></div>
          <div class="absolute w-2/5 h-1/10 left-1/2 -translate-x-1/2 top-1/10" style="background: ${theme.colors.paddle}; height: 10%;"></div>
          <div class="absolute w-3/12 aspect-square left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style="background: ${theme.colors.ball};"></div>
        </div>
        <span class="block text-center text-xs uppercase text-[#5db3d1] font-['Pixel_Game']">${displayName}</span>
      </button>
    `;
  }).join('');
}

function updateColorPickers(customization: BoardCustomization) {
  const colorInputs = {
    background: document.getElementById("color-background") as HTMLInputElement,
    paddle: document.getElementById("color-paddle") as HTMLInputElement,
    ball: document.getElementById("color-ball") as HTMLInputElement,
    border: document.getElementById("color-border") as HTMLInputElement,
    centerLine: document.getElementById("color-centerline") as HTMLInputElement,
  };

  Object.entries(colorInputs).forEach(([key, input]) => {
    if (input) {
      input.value = customization.colors[key as keyof typeof customization.colors];
    }
  });
}

function updatePreview(customization: BoardCustomization) {
  const canvas = document.getElementById("preview-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, width, height);

  // Draw center line (horizontal for vertical game)
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = customization.colors.centerLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, height / 2);
  ctx.lineTo(width - 10, height / 2);
  ctx.stroke();
  ctx.restore();

  // Draw border
  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Draw paddles (scaled for preview)
  const paddleW = 60;
  const paddleH = 10;
  const paddleOffset = 15;
  const paddleX = (width - paddleW) / 2;

  ctx.fillStyle = customization.colors.paddle;
  // Top paddle
  ctx.fillRect(paddleX, paddleOffset, paddleW, paddleH);
  // Bottom paddle
  ctx.fillRect(paddleX, height - paddleOffset - paddleH, paddleW, paddleH);

  // Draw ball (square)
  const ballSize = 8;
  const ballX = width / 2 - ballSize / 2;
  const ballY = height / 2 - ballSize / 2;

  ctx.fillStyle = customization.colors.ball;
  ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

function highlightActiveTheme(activeTheme: string) {
  // Remove active styling from all themes
  document.querySelectorAll('[data-theme]').forEach(btn => {
    btn.classList.remove('active');
  });

  // Add active styling to current theme
  const activeBtn = document.getElementById(`theme-${activeTheme}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}
