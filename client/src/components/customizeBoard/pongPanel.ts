import { i18n } from "../../services/i18n";

export function createPongPanel(): string {
  return `
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
  `;
}
