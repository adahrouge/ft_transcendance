export function createTabButtons(): string {
  return `
    <div class="customize-board-tabs">
      <button class="customize-board-tab active" id="tab-pong" data-tab="pong">PONG</button>
      <button class="customize-board-tab" id="tab-xo" data-tab="xo">TIC TAC TOE</button>
    </div>
  `;
}
