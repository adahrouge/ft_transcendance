export function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
  )[c]);
}

export function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

export function $(sel: string, root: ParentNode = document): HTMLElement {
  const el = root.querySelector(sel);
  if (!el) throw new Error('Selector not found: ' + sel);
  return el as HTMLElement;
}

export function on(
  el: Element | Document | Window,
  type: string,
  handler: EventListenerOrEventListenerObject,
  opts?: boolean | AddEventListenerOptions
) {
  el.addEventListener(type, handler, opts);
  return () => el.removeEventListener(type, handler, opts as any);
}

export function sanitizeAlias(input: string): string {
  // 1–16 chars, letters/numbers/space/_/-
  const s = input.trim();
  if (!/^[A-Za-z0-9 _-]{1,16}$/.test(s)) throw new Error('Alias must be 1–16 chars: letters, numbers, space, _ or -');
  return s;
}
