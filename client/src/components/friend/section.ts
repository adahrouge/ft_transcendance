export interface SectionOptions {
  title: string;
  style?: string;
  titleColor?: string;
  items: string[];
}

export function renderSection(opts: SectionOptions): string {
  return `
    <div class="friend-list-section" ${opts.style ? `style="${opts.style}"` : ''}>
      <h3 class="friend-section-title" ${opts.titleColor ? `style="color: ${opts.titleColor}"` : ''}>${opts.title}</h3>
      <div class="friend-list">${opts.items.join('')}</div>
    </div>
  `;
}
