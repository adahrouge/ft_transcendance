// src/utils.ts

export function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]
  );
}

// Clamp helper (used in various places)
export function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

// DOM helpers
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

/**
 * sanitizeAlias
 * - Enforces 1–16 chars
 * - Allowed: letters, numbers, space, underscore, hyphen
 * - Trims excess, collapses repeated whitespace to single space
 */
export function sanitizeAlias(input: string): string {
  const s = input.trim().replace(/\s+/g, ' ');
  if (!/^[A-Za-z0-9 _-]{1,16}$/.test(s)) {
    throw new Error('Alias must be 1–16 chars: letters, numbers, space, _ or -');
  }
  return s;
}

/**
 * normAlias: normalization for uniqueness checks (case-insensitive; trimmed; single spaces)
 */
export function normAlias(a: string): string {
  return a.trim().replace(/\s+/g, ' ').toLowerCase();
}
