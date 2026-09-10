/**
 * Design tokens.
 *
 * Everything visual comes from here: color, type, spacing, radius, elevation,
 * motion. Components never hardcode a hex, a font size, or a duration.
 *
 * Scales are 4pt-based so vertical rhythm stays consistent across screens.
 */

export const lightColors = {
  // Surfaces — sunken < bg < surface < surfaceAlt (raised).
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceAlt: '#ffffff',
  surfaceSunken: '#eef1f6',
  card: '#ffffff', // alias of surface, kept for existing call sites

  // Brand
  primary: '#0d9488',
  primaryLight: '#14b8a6',
  primaryDark: '#0f766e',
  primarySoft: '#ccfbf1',
  onPrimary: '#ffffff',

  // Text — all pass WCAG AA on `bg` and `surface`.
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',

  // Lines
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  focus: '#0d9488',

  // Semantic
  income: '#15803d',
  incomeLight: '#dcfce7',
  expense: '#dc2626',
  expenseLight: '#fee2e2',
  transfer: '#0d9488',
  transferLight: '#ccfbf1',
  adjustment: '#7c3aed',
  adjustmentLight: '#ede9fe',
  warning: '#b45309',
  warningLight: '#fef3c7',
  info: '#1d4ed8',
  infoLight: '#dbeafe',

  white: '#ffffff',
  overlay: 'rgba(15, 23, 42, 0.45)',
  skeleton: '#e2e8f0',
};

export const darkColors: typeof lightColors = {
  bg: '#0b1220',
  surface: '#131c2e',
  surfaceAlt: '#1a2439',
  surfaceSunken: '#080e19',
  card: '#131c2e',

  primary: '#2dd4bf',
  primaryLight: '#5eead4',
  primaryDark: '#14b8a6',
  primarySoft: '#134e4a',
  onPrimary: '#052e2b',

  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',

  border: '#243044',
  borderStrong: '#33415c',
  focus: '#2dd4bf',

  income: '#4ade80',
  incomeLight: '#14532d',
  expense: '#f87171',
  expenseLight: '#7f1d1d',
  transfer: '#2dd4bf',
  transferLight: '#134e4a',
  adjustment: '#c4b5fd',
  adjustmentLight: '#3b0764',
  warning: '#fbbf24',
  warningLight: '#451a03',
  info: '#93c5fd',
  infoLight: '#1e3a8a',

  white: '#ffffff',
  overlay: 'rgba(2, 6, 15, 0.7)',
  skeleton: '#1e293b',
};

export type ColorTokens = typeof lightColors;
export type Resolved = 'light' | 'dark';

/**
 * Categorical palette for charts. Ordered by hue distance so adjacent slices
 * stay distinguishable, and tuned per theme so slices keep contrast against
 * the card behind them.
 */
const CHART_LIGHT = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#84cc16', '#f97316'];
const CHART_DARK = ['#2dd4bf', '#fbbf24', '#f87171', '#c4b5fd', '#60a5fa', '#f9a8d4', '#bef264', '#fdba74'];

export function chartPalette(resolved: Resolved): string[] {
  return resolved === 'dark' ? CHART_DARK : CHART_LIGHT;
}

export function chartMuted(resolved: Resolved): string {
  return resolved === 'dark' ? '#64748b' : '#94a3b8';
}

// 4pt spacing scale.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

/**
 * Type scale. `fontSize` keys are the historical names; `lineHeight` pairs with
 * them 1:1 so text blocks keep a predictable height.
 */
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 32,
  hero: 40,
};

export const lineHeight = {
  xs: 16,
  sm: 18,
  md: 21,
  lg: 24,
  xl: 26,
  xxl: 30,
  display: 38,
  hero: 46,
};

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
} as const;

/**
 * Elevation levels 0–4. Shadows read as depth on light backgrounds; on dark the
 * surface tint carries most of the separation, so the shadow only deepens the
 * ambient darkness rather than trying to be visible on its own.
 */
export const elevation = {
  0: {},
  1: { shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  2: { shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  3: { shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  4: { shadowColor: '#0f172a', shadowOpacity: 0.16, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
} as const;

export type ElevationLevel = keyof typeof elevation;

// Legacy alias — same values as elevation[2].
export const shadow = { card: elevation[2] };

// Motion. Durations in ms; anything animated uses one of these three.
export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
};

/**
 * Minimum interactive size (points). Anything a finger targets is padded or
 * hit-slopped up to this, per iOS HIG (44) / Material (48) guidance.
 */
export const HIT_SIZE = 44;
export const hitSlopFor = (size: number) => {
  const pad = Math.max(0, Math.round((HIT_SIZE - size) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
};
