import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import { boardCustomizationService, xoBoardCustomizationService } from "../services/boardCustomization";
import { BoardCustomization, DEFAULT_CUSTOMIZATION, THEME_PRESETS, XoBoardCustomization, DEFAULT_XO_CUSTOMIZATION, XO_THEME_PRESETS } from "../types/boardCustomization";
import "../styles/customizeBoard.css";

export function renderCustomizeBoardPage(): string {
  setTimeout(() => {
    setupCustomizeBoard();
  }, 0);

  return `
    <div class="customize-board-container">
      <div class="customize-board-overlay"></div>
      <div class="customize-board-content">
        <div class="customize-board-box">
          <h1 class="customize-board-title">${i18n.t('customize_board')}</h1>
          <p class="customize-board-subtitle">${i18n.t('personalize_board')}</p>

          <!-- Game Tabs -->
          <div class="customize-board-tabs">
            <button class="customize-board-tab active" id="tab-pong" data-tab="pong">PONG</button>
            <button class="customize-board-tab" id="tab-xo" data-tab="xo">TIC TAC TOE</button>
          </div>

          <!-- Pong Customization Panel -->
          <div class="customize-board-panel" id="panel-pong">
            <div class="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <!-- Controls Section -->
              <div class="flex-1 order-2 lg:order-1">
                <!-- Theme Presets -->
                <div class="mb-4">
                  <h3 class="customize-board-section-title text-sm sm:text-base">${i18n.t('theme_presets')}</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" id="pong-theme-presets"></div>
                </div>

                <!-- Color Customization -->
                <div class="mb-4">
                  <h3 class="customize-board-section-title text-sm sm:text-base">${i18n.t('custom_colors')}</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('background')}</label>
                      <input type="color" id="pong-color-background" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('paddle')}</label>
                      <input type="color" id="pong-color-paddle" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('ball')}</label>
                      <input type="color" id="pong-color-ball" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('border')}</label>
                      <input type="color" id="pong-color-border" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('center_line')}</label>
                      <input type="color" id="pong-color-centerline" class="customize-board-color-input w-full h-8">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Preview Section -->
              <div class="flex-1 flex flex-col items-center order-1 lg:order-2">
                <h3 class="customize-board-section-title w-full text-center lg:text-left text-sm sm:text-base mb-2">${i18n.t('preview')}</h3>
                <div class="customize-board-preview-container mb-4 w-full max-w-[280px] sm:max-w-[300px]">
                  <canvas id="pong-preview-canvas" width="300" height="300" class="rounded-lg shadow-2xl w-full h-auto"></canvas>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 flex-wrap justify-center w-full">
                  <button class="customize-board-btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2 flex-1 sm:flex-none min-w-[80px]" id="pong-btn-reset">${i18n.t('reset_default')}</button>
                  <button class="customize-board-btn text-xs sm:text-sm px-3 sm:px-6 py-2 flex-1 sm:flex-none min-w-[80px]" id="pong-btn-save">${i18n.t('save')}</button>
                  <button class="customize-board-btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2 flex-1 sm:flex-none min-w-[80px]" id="btn-back">${i18n.t('back')}</button>
                </div>

                <div id="pong-status-message" class="customize-board-status mt-3 text-center h-5 text-xs sm:text-sm"></div>
              </div>
            </div>
          </div>

          <!-- XO Customization Panel -->
          <div class="customize-board-panel hidden" id="panel-xo">
            <div class="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <!-- Controls Section -->
              <div class="flex-1 order-2 lg:order-1">
                <!-- Theme Presets -->
                <div class="mb-4">
                  <h3 class="customize-board-section-title text-sm sm:text-base">${i18n.t('theme_presets')}</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" id="xo-theme-presets"></div>
                </div>

                <!-- Color Customization -->
                <div class="mb-4">
                  <h3 class="customize-board-section-title text-sm sm:text-base">${i18n.t('custom_colors')}</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('background')}</label>
                      <input type="color" id="xo-color-background" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('grid')}</label>
                      <input type="color" id="xo-color-grid" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('x_color')}</label>
                      <input type="color" id="xo-color-x" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('o_color')}</label>
                      <input type="color" id="xo-color-o" class="customize-board-color-input w-full h-8">
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="customize-board-label text-xs">${i18n.t('border')}</label>
                      <input type="color" id="xo-color-border" class="customize-board-color-input w-full h-8">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Preview Section -->
              <div class="flex-1 flex flex-col items-center order-1 lg:order-2">
                <h3 class="customize-board-section-title w-full text-center lg:text-left text-sm sm:text-base mb-2">${i18n.t('preview')}</h3>
                <div class="customize-board-preview-container mb-4 w-full max-w-[280px] sm:max-w-[300px]">
                  <canvas id="xo-preview-canvas" width="300" height="300" class="rounded-lg shadow-2xl w-full h-auto"></canvas>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 flex-wrap justify-center w-full">
                  <button class="customize-board-btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2 flex-1 sm:flex-none min-w-[80px]" id="xo-btn-reset">${i18n.t('reset_default')}</button>
                  <button class="customize-board-btn text-xs sm:text-sm px-3 sm:px-6 py-2 flex-1 sm:flex-none min-w-[80px]" id="xo-btn-save">${i18n.t('save')}</button>
                  <button class="customize-board-btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2 flex-1 sm:flex-none min-w-[80px]" id="xo-btn-back">${i18n.t('back')}</button>
                </div>

                <div id="xo-status-message" class="customize-board-status mt-3 text-center h-5 text-xs sm:text-sm"></div>
              </div>
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

  // Setup tab switching
  const tabPong = document.getElementById("tab-pong");
  const tabXo = document.getElementById("tab-xo");
  const panelPong = document.getElementById("panel-pong");
  const panelXo = document.getElementById("panel-xo");

  tabPong?.addEventListener("click", () => {
    tabPong.classList.add("active");
    tabXo?.classList.remove("active");
    panelPong?.classList.remove("hidden");
    panelXo?.classList.add("hidden");
  });

  tabXo?.addEventListener("click", () => {
    tabXo.classList.add("active");
    tabPong?.classList.remove("active");
    panelXo?.classList.remove("hidden");
    panelPong?.classList.add("hidden");
  });

  // Setup Pong customization
  await setupPongCustomization();

  // Setup XO customization
  await setupXoCustomization();

  // Back buttons
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
  document.getElementById("xo-btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

// ==================== PONG CUSTOMIZATION ====================

async function setupPongCustomization() {
  const customization = await boardCustomizationService.loadCustomization();
  let currentCustomization: BoardCustomization = { ...customization };

  renderPongThemePresets(currentCustomization);
  updatePongColorPickers(currentCustomization);
  updatePongPreview(currentCustomization);

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

  // Save button
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

  // Reset button
  const resetBtn = document.getElementById("pong-btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentCustomization = { ...DEFAULT_CUSTOMIZATION };
      updatePongColorPickers(currentCustomization);
      updatePongPreview(currentCustomization);
      highlightActivePongTheme(currentCustomization.theme);
    });
  }

  // Theme preset click handlers
  Object.keys(THEME_PRESETS).forEach((themeName) => {
    const themeBtn = document.getElementById(`pong-theme-${themeName}`);
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        currentCustomization = { ...THEME_PRESETS[themeName] };
        updatePongColorPickers(currentCustomization);
        updatePongPreview(currentCustomization);
        highlightActivePongTheme(themeName);
      });
    }
  });

  highlightActivePongTheme(currentCustomization.theme);
}

function renderPongThemePresets(_currentCustomization: BoardCustomization) {
  const presetsContainer = document.getElementById("pong-theme-presets");
  if (!presetsContainer) return;

  const themeNames = Object.keys(THEME_PRESETS);
  presetsContainer.innerHTML = themeNames.map((themeName) => {
    const theme = THEME_PRESETS[themeName];
    const displayName = (i18n as any).t(themeName) || themeName.charAt(0).toUpperCase() + themeName.slice(1);

    return `
      <button class="customize-board-preset-btn" id="pong-theme-${themeName}" data-theme="${themeName}">
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

function updatePongColorPickers(customization: BoardCustomization) {
  const colorInputs = {
    background: document.getElementById("pong-color-background") as HTMLInputElement,
    paddle: document.getElementById("pong-color-paddle") as HTMLInputElement,
    ball: document.getElementById("pong-color-ball") as HTMLInputElement,
    border: document.getElementById("pong-color-border") as HTMLInputElement,
    centerLine: document.getElementById("pong-color-centerline") as HTMLInputElement,
  };

  Object.entries(colorInputs).forEach(([key, input]) => {
    if (input) {
      input.value = customization.colors[key as keyof typeof customization.colors];
    }
  });
}

function updatePongPreview(customization: BoardCustomization) {
  const canvas = document.getElementById("pong-preview-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, width, height);

  // Draw center line
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

  // Draw paddles
  const paddleW = 60;
  const paddleH = 10;
  const paddleOffset = 15;
  const paddleX = (width - paddleW) / 2;

  ctx.fillStyle = customization.colors.paddle;
  ctx.fillRect(paddleX, paddleOffset, paddleW, paddleH);
  ctx.fillRect(paddleX, height - paddleOffset - paddleH, paddleW, paddleH);

  // Draw ball
  const ballSize = 8;
  const ballX = width / 2 - ballSize / 2;
  const ballY = height / 2 - ballSize / 2;

  ctx.fillStyle = customization.colors.ball;
  ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

function highlightActivePongTheme(activeTheme: string) {
  document.querySelectorAll('#pong-theme-presets [data-theme]').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`pong-theme-${activeTheme}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// ==================== XO CUSTOMIZATION ====================

async function setupXoCustomization() {
  const customization = await xoBoardCustomizationService.loadCustomization();
  let currentCustomization: XoBoardCustomization = { ...customization };

  renderXoThemePresets(currentCustomization);
  updateXoColorPickers(currentCustomization);
  updateXoPreview(currentCustomization);

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

  // Save button
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

  // Reset button
  const resetBtn = document.getElementById("xo-btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentCustomization = { ...DEFAULT_XO_CUSTOMIZATION };
      updateXoColorPickers(currentCustomization);
      updateXoPreview(currentCustomization);
      highlightActiveXoTheme(currentCustomization.theme);
    });
  }

  // Theme preset click handlers
  Object.keys(XO_THEME_PRESETS).forEach((themeName) => {
    const themeBtn = document.getElementById(`xo-theme-${themeName}`);
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        currentCustomization = { ...XO_THEME_PRESETS[themeName] };
        updateXoColorPickers(currentCustomization);
        updateXoPreview(currentCustomization);
        highlightActiveXoTheme(themeName);
      });
    }
  });

  highlightActiveXoTheme(currentCustomization.theme);
}

function renderXoThemePresets(_currentCustomization: XoBoardCustomization) {
  const presetsContainer = document.getElementById("xo-theme-presets");
  if (!presetsContainer) return;

  const themeNames = Object.keys(XO_THEME_PRESETS);
  presetsContainer.innerHTML = themeNames.map((themeName) => {
    const theme = XO_THEME_PRESETS[themeName];
    const displayName = (i18n as any).t(themeName) || themeName.charAt(0).toUpperCase() + themeName.slice(1);

    return `
      <button class="customize-board-preset-btn" id="xo-theme-${themeName}" data-theme="${themeName}">
        <div class="w-full aspect-square rounded-md relative mb-2 overflow-hidden" style="background: ${theme.colors.background};">
          <div class="absolute inset-2" style="border: 2px solid ${theme.colors.border};"></div>
          <!-- Grid lines -->
          <div class="absolute top-1/3 left-2 right-2 h-[2px]" style="background: ${theme.colors.grid};"></div>
          <div class="absolute top-2/3 left-2 right-2 h-[2px]" style="background: ${theme.colors.grid};"></div>
          <div class="absolute left-1/3 top-2 bottom-2 w-[2px]" style="background: ${theme.colors.grid};"></div>
          <div class="absolute left-2/3 top-2 bottom-2 w-[2px]" style="background: ${theme.colors.grid};"></div>
          <!-- X symbol -->
          <div class="absolute text-xs font-bold" style="color: ${theme.colors.xColor}; top: 10%; left: 12%;">X</div>
          <!-- O symbol -->
          <div class="absolute text-xs font-bold" style="color: ${theme.colors.oColor}; top: 40%; left: 45%;">O</div>
        </div>
        <span class="block text-center text-xs uppercase text-[#5db3d1] font-['Pixel_Game']">${displayName}</span>
      </button>
    `;
  }).join('');
}

function updateXoColorPickers(customization: XoBoardCustomization) {
  const colorInputs = {
    background: document.getElementById("xo-color-background") as HTMLInputElement,
    grid: document.getElementById("xo-color-grid") as HTMLInputElement,
    xColor: document.getElementById("xo-color-x") as HTMLInputElement,
    oColor: document.getElementById("xo-color-o") as HTMLInputElement,
    border: document.getElementById("xo-color-border") as HTMLInputElement,
  };

  Object.entries(colorInputs).forEach(([key, input]) => {
    if (input) {
      input.value = customization.colors[key as keyof typeof customization.colors];
    }
  });
}

function updateXoPreview(customization: XoBoardCustomization) {
  const canvas = document.getElementById("xo-preview-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, width, height);

  // Draw border
  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Draw grid
  ctx.strokeStyle = customization.colors.grid;
  ctx.lineWidth = 4;
  ctx.beginPath();

  // Vertical lines
  ctx.moveTo(width / 3, 20);
  ctx.lineTo(width / 3, height - 20);
  ctx.moveTo(2 * width / 3, 20);
  ctx.lineTo(2 * width / 3, height - 20);

  // Horizontal lines
  ctx.moveTo(20, height / 3);
  ctx.lineTo(width - 20, height / 3);
  ctx.moveTo(20, 2 * height / 3);
  ctx.lineTo(width - 20, 2 * height / 3);

  ctx.stroke();

  // Draw sample X in top-left cell
  const cellW = width / 3;
  const cellH = height / 3;
  const xSize = 30;
  const xCenterX = cellW / 2;
  const xCenterY = cellH / 2;

  ctx.strokeStyle = customization.colors.xColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(xCenterX - xSize, xCenterY - xSize);
  ctx.lineTo(xCenterX + xSize, xCenterY + xSize);
  ctx.moveTo(xCenterX + xSize, xCenterY - xSize);
  ctx.lineTo(xCenterX - xSize, xCenterY + xSize);
  ctx.stroke();

  // Draw sample O in center cell
  const oCenterX = width / 2;
  const oCenterY = height / 2;
  const oRadius = 30;

  ctx.strokeStyle = customization.colors.oColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(oCenterX, oCenterY, oRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw another X in bottom-right cell
  const x2CenterX = 2.5 * cellW;
  const x2CenterY = 2.5 * cellH;

  ctx.strokeStyle = customization.colors.xColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x2CenterX - xSize, x2CenterY - xSize);
  ctx.lineTo(x2CenterX + xSize, x2CenterY + xSize);
  ctx.moveTo(x2CenterX + xSize, x2CenterY - xSize);
  ctx.lineTo(x2CenterX - xSize, x2CenterY + xSize);
  ctx.stroke();
}

function highlightActiveXoTheme(activeTheme: string) {
  document.querySelectorAll('#xo-theme-presets [data-theme]').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`xo-theme-${activeTheme}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}
