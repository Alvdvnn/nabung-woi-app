// WCAG 2.x relative luminance and contrast ratio. Pure functions, no deps,
// shared by the theme contrast check script and the appearance screen.

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two hex colors (1 to 21). Null for non-hex input. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_TEXT = 4.5;
export const AA_LARGE = 3;

/** `fg` at `alpha` (0 to 1) composited over an opaque `bg`, as a hex color. */
export function blendHex(fg: string, bg: string, alpha: number): string {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!f || !b) return bg;
  const mix = (i: number) =>
    Math.round(f[i] * alpha + b[i] * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  return `#${mix(0)}${mix(1)}${mix(2)}`;
}

/** The candidate with the highest contrast against `bg`. */
export function readableOn(bg: string, candidates: readonly string[]): string {
  let best = candidates[0];
  let bestRatio = -1;
  for (const c of candidates) {
    const r = contrastRatio(c, bg) ?? 0;
    if (r > bestRatio) {
      best = c;
      bestRatio = r;
    }
  }
  return best;
}

/** Tokens `inkOn` chooses between: white plus the palette's two dark inks. */
export const INK_TOKENS = ['white', 'onPrimary', 'textPrimary'] as const;

/**
 * Text/icon color for a filled accent background (a selected pill, a danger
 * button, a heat cell). Accent tokens are dark in light mode and light in dark
 * mode, so no single ink works on all of them: `white` vanishes on a dark-mode
 * accent. Use this whenever the fill is not known to be `primary` (which has
 * its own `onPrimary`).
 */
export function inkOn(colors: Record<(typeof INK_TOKENS)[number], string>, bg: string): string {
  return readableOn(
    bg,
    INK_TOKENS.map((k) => colors[k]),
  );
}
