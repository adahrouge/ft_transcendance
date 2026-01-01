import { i18n } from "../../services/i18n";
import { BoardCustomization, THEME_PRESETS } from "../../types/boardCustomization";

export function renderPongThemePresets() {
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

export function updatePongColorPickers(customization: BoardCustomization) {
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

export function updatePongPreview(customization: BoardCustomization) {
  const canvas = document.getElementById("pong-preview-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = customization.colors.centerLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, height / 2);
  ctx.lineTo(width - 10, height / 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  const paddleW = 60;
  const paddleH = 10;
  const paddleOffset = 15;
  const paddleX = (width - paddleW) / 2;

  ctx.fillStyle = customization.colors.paddle;
  ctx.fillRect(paddleX, paddleOffset, paddleW, paddleH);
  ctx.fillRect(paddleX, height - paddleOffset - paddleH, paddleW, paddleH);

  const ballSize = 8;
  const ballX = width / 2 - ballSize / 2;
  const ballY = height / 2 - ballSize / 2;

  ctx.fillStyle = customization.colors.ball;
  ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

export function highlightActivePongTheme(activeTheme: string) {
  document.querySelectorAll('#pong-theme-presets [data-theme]').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`pong-theme-${activeTheme}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}
