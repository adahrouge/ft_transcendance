import { i18n } from "../../services/i18n";
import { XoBoardCustomization, XO_THEME_PRESETS } from "../../types/boardCustomization";

export function renderXoThemePresets() {
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

export function updateXoColorPickers(customization: XoBoardCustomization) {
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

export function updateXoPreview(customization: XoBoardCustomization) {
  const canvas = document.getElementById("xo-preview-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = customization.colors.grid;
  ctx.lineWidth = 4;
  ctx.beginPath();

  ctx.moveTo(width / 3, 20);
  ctx.lineTo(width / 3, height - 20);
  ctx.moveTo(2 * width / 3, 20);
  ctx.lineTo(2 * width / 3, height - 20);

  ctx.moveTo(20, height / 3);
  ctx.lineTo(width - 20, height / 3);
  ctx.moveTo(20, 2 * height / 3);
  ctx.lineTo(width - 20, 2 * height / 3);

  ctx.stroke();

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

  const oCenterX = width / 2;
  const oCenterY = height / 2;
  const oRadius = 30;

  ctx.strokeStyle = customization.colors.oColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(oCenterX, oCenterY, oRadius, 0, Math.PI * 2);
  ctx.stroke();

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

export function highlightActiveXoTheme(activeTheme: string) {
  document.querySelectorAll('#xo-theme-presets [data-theme]').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`xo-theme-${activeTheme}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}
