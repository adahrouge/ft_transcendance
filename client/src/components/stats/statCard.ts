export function renderStatCard(value: string, label: string, extraClass = ''): string {
  return `
    <div class="stats-card ${extraClass}">
      <div class="stats-card-value">${value}</div>
      <div class="stats-card-label">${label}</div>
    </div>
  `;
}
