/**
 * Design tokens.
 *
 * Everything visual comes from here: color, type, spacing, radius, elevation,
 * motion. Components never hardcode a hex, a font size, or a duration.
 *
 * Color is palette x mode. Every palette ships a complete `ColorTokens` set for
 * light and dark, plus its own chart palette. `scripts/check-contrast.mjs`
 * verifies every text/background pair meets WCAG AA; run it after editing.
 *
 * Scales are 4pt-based so vertical rhythm stays consistent across screens.
 */

export type Resolved = 'light' | 'dark';

export interface ColorTokens {
  // Surfaces: sunken < bg < surface < surfaceAlt (raised).
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  /** Alias of surface, kept for existing call sites. */
  card: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;
  onPrimary: string;

  // Text: all pass WCAG AA on every surface token.
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Lines
  border: string;
  borderStrong: string;
  focus: string;

  // Semantic (used as text, so AA on bg and surface)
  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  transfer: string;
  transferLight: string;
  adjustment: string;
  adjustmentLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  white: string;
  overlay: string;
  skeleton: string;
}

export type PaletteId =
  | 'default'
  | 'pastel'
  | 'mono'
  | 'ocean'
  | 'forest'
  | 'midnight'
  | 'sunset'
  | 'lavender';

export interface Palette {
  id: PaletteId;
  light: ColorTokens;
  dark: ColorTokens;
  chart: { light: string[]; dark: string[] };
}

/**
 * Minimal spec a palette author fills in. Aliases (`card`, `focus`,
 * `transfer`, `white`) are derived so every palette stays consistent.
 */
type PaletteSpec = Omit<ColorTokens, 'card' | 'focus' | 'transfer' | 'transferLight' | 'white'> & {
  transfer?: string;
  transferLight?: string;
};

function tokens(spec: PaletteSpec): ColorTokens {
  return {
    ...spec,
    card: spec.surface,
    focus: spec.primary,
    transfer: spec.transfer ?? spec.primary,
    transferLight: spec.transferLight ?? spec.primarySoft,
    white: '#ffffff',
  };
}

const LIGHT_OVERLAY = 'rgba(15, 23, 42, 0.45)';
const DARK_OVERLAY = 'rgba(2, 6, 15, 0.7)';

// Shared semantic sets. Light values pass AA on white; dark values on #0b1220-ish surfaces.
const SEM_LIGHT = {
  income: '#15803d',
  incomeLight: '#dcfce7',
  expense: '#b91c1c',
  expenseLight: '#fee2e2',
  adjustment: '#7c3aed',
  adjustmentLight: '#ede9fe',
  warning: '#b45309',
  warningLight: '#fef3c7',
  info: '#1d4ed8',
  infoLight: '#dbeafe',
};

const SEM_DARK = {
  income: '#4ade80',
  incomeLight: '#14532d',
  expense: '#f87171',
  expenseLight: '#4c0f0f',
  adjustment: '#c4b5fd',
  adjustmentLight: '#3b0764',
  warning: '#fbbf24',
  warningLight: '#451a03',
  info: '#93c5fd',
  infoLight: '#1e3a8a',
};

export const PALETTES: Record<PaletteId, Palette> = {
  default: {
    id: 'default',
    light: tokens({
      bg: '#f4f6f9',
      surface: '#ffffff',
      surfaceAlt: '#ffffff',
      surfaceSunken: '#eef1f6',
      primary: '#0f766e',
      primaryLight: '#14b8a6',
      primaryDark: '#115e59',
      primarySoft: '#ccfbf1',
      onPrimary: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#5f6f84',
      border: '#e2e8f0',
      borderStrong: '#cbd5e1',
      ...SEM_LIGHT,
      overlay: LIGHT_OVERLAY,
      skeleton: '#e2e8f0',
    }),
    dark: tokens({
      bg: '#0b1220',
      surface: '#131c2e',
      surfaceAlt: '#1a2439',
      surfaceSunken: '#080e19',
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
      ...SEM_DARK,
      overlay: DARK_OVERLAY,
      skeleton: '#1e293b',
    }),
    chart: {
      light: ['#0f766e', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#84cc16', '#f97316'],
      dark: ['#2dd4bf', '#fbbf24', '#f87171', '#c4b5fd', '#60a5fa', '#f9a8d4', '#bef264', '#fdba74'],
    },
  },

  pastel: {
    id: 'pastel',
    light: tokens({
      bg: '#fff7f3',
      surface: '#ffffff',
      surfaceAlt: '#fffaf7',
      surfaceSunken: '#fdebe4',
      primary: '#be185d',
      primaryLight: '#ec4899',
      primaryDark: '#9d174d',
      primarySoft: '#fce7f3',
      onPrimary: '#ffffff',
      textPrimary: '#3b1f2b',
      textSecondary: '#6b4a57',
      textMuted: '#7e5d6a',
      border: '#f3d9e1',
      borderStrong: '#e9bfcc',
      ...SEM_LIGHT,
      expense: '#c2410c',
      expenseLight: '#ffedd5',
      overlay: 'rgba(59, 31, 43, 0.45)',
      skeleton: '#f3d9e1',
    }),
    dark: tokens({
      bg: '#1f1419',
      surface: '#2a1b22',
      surfaceAlt: '#33222b',
      surfaceSunken: '#170e13',
      primary: '#f9a8d4',
      primaryLight: '#fbcfe8',
      primaryDark: '#f472b6',
      primarySoft: '#4a1d33',
      onPrimary: '#3b0a20',
      textPrimary: '#fdf2f8',
      textSecondary: '#f0d0dc',
      textMuted: '#c9a3b3',
      border: '#4a2d39',
      borderStrong: '#5f3b4a',
      ...SEM_DARK,
      income: '#86efac',
      expense: '#fdba74',
      expenseLight: '#7c2d12',
      adjustment: '#d8b4fe',
      warning: '#fcd34d',
      overlay: 'rgba(10, 4, 7, 0.7)',
      skeleton: '#3d2630',
    }),
    chart: {
      light: ['#be185d', '#f59e0b', '#0e7490', '#7c3aed', '#c2410c', '#15803d', '#1d4ed8', '#a16207'],
      dark: ['#f9a8d4', '#fcd34d', '#67e8f9', '#d8b4fe', '#fdba74', '#86efac', '#93c5fd', '#fde68a'],
    },
  },

  mono: {
    id: 'mono',
    light: tokens({
      bg: '#f5f5f5',
      surface: '#ffffff',
      surfaceAlt: '#fafafa',
      surfaceSunken: '#ececec',
      primary: '#171717',
      primaryLight: '#404040',
      primaryDark: '#000000',
      primarySoft: '#e5e5e5',
      onPrimary: '#ffffff',
      textPrimary: '#0a0a0a',
      textSecondary: '#404040',
      textMuted: '#595959',
      border: '#e0e0e0',
      borderStrong: '#c7c7c7',
      ...SEM_LIGHT,
      expense: '#b91c1c',
      adjustment: '#6d28d9',
      warning: '#a16207',
      warningLight: '#fef9c3',
      overlay: 'rgba(0, 0, 0, 0.45)',
      skeleton: '#e0e0e0',
    }),
    dark: tokens({
      bg: '#121212',
      surface: '#1c1c1c',
      surfaceAlt: '#242424',
      surfaceSunken: '#0a0a0a',
      primary: '#fafafa',
      primaryLight: '#ffffff',
      primaryDark: '#d4d4d4',
      primarySoft: '#2e2e2e',
      onPrimary: '#111111',
      textPrimary: '#f5f5f5',
      textSecondary: '#d4d4d4',
      textMuted: '#a3a3a3',
      border: '#2e2e2e',
      borderStrong: '#3f3f3f',
      ...SEM_DARK,
      income: '#86efac',
      expense: '#fca5a5',
      warning: '#fcd34d',
      overlay: 'rgba(0, 0, 0, 0.7)',
      skeleton: '#2a2a2a',
    }),
    chart: {
      light: ['#171717', '#737373', '#15803d', '#b91c1c', '#1d4ed8', '#a16207', '#6d28d9', '#0e7490'],
      dark: ['#fafafa', '#a3a3a3', '#86efac', '#fca5a5', '#93c5fd', '#fcd34d', '#c4b5fd', '#67e8f9'],
    },
  },

  ocean: {
    id: 'ocean',
    light: tokens({
      bg: '#f0f7ff',
      surface: '#ffffff',
      surfaceAlt: '#f7fbff',
      surfaceSunken: '#e3eefb',
      primary: '#1d4ed8',
      primaryLight: '#3b82f6',
      primaryDark: '#1e40af',
      primarySoft: '#dbeafe',
      onPrimary: '#ffffff',
      textPrimary: '#0c1a33',
      textSecondary: '#3b4f6b',
      textMuted: '#55657f',
      border: '#d6e3f3',
      borderStrong: '#b9cde6',
      ...SEM_LIGHT,
      info: '#0e7490',
      infoLight: '#cffafe',
      overlay: 'rgba(12, 26, 51, 0.45)',
      skeleton: '#d6e3f3',
    }),
    dark: tokens({
      bg: '#071323',
      surface: '#0f1e33',
      surfaceAlt: '#16284a',
      surfaceSunken: '#040c18',
      primary: '#60a5fa',
      primaryLight: '#93c5fd',
      primaryDark: '#3b82f6',
      primarySoft: '#172554',
      onPrimary: '#061a3a',
      textPrimary: '#eef4ff',
      textSecondary: '#c3d2e8',
      textMuted: '#93a8c8',
      border: '#1f3352',
      borderStrong: '#2c4568',
      ...SEM_DARK,
      info: '#67e8f9',
      infoLight: '#164e63',
      overlay: 'rgba(2, 8, 20, 0.7)',
      skeleton: '#1a2b47',
    }),
    chart: {
      light: ['#1d4ed8', '#0e7490', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#15803d', '#f97316'],
      dark: ['#60a5fa', '#67e8f9', '#fbbf24', '#f87171', '#c4b5fd', '#f9a8d4', '#4ade80', '#fdba74'],
    },
  },

  forest: {
    id: 'forest',
    light: tokens({
      bg: '#f3f8f2',
      surface: '#ffffff',
      surfaceAlt: '#f8fbf7',
      surfaceSunken: '#e6efe3',
      primary: '#166534',
      primaryLight: '#22c55e',
      primaryDark: '#14532d',
      primarySoft: '#dcfce7',
      onPrimary: '#ffffff',
      textPrimary: '#10231a',
      textSecondary: '#3d5a48',
      textMuted: '#577062',
      border: '#d5e4d2',
      borderStrong: '#b8cfb4',
      ...SEM_LIGHT,
      income: '#047857',
      incomeLight: '#d1fae5',
      expense: '#c2410c',
      expenseLight: '#ffedd5',
      warning: '#a16207',
      warningLight: '#fef9c3',
      overlay: 'rgba(16, 35, 26, 0.45)',
      skeleton: '#d5e4d2',
    }),
    dark: tokens({
      bg: '#0a1a0f',
      surface: '#11261a',
      surfaceAlt: '#183322',
      surfaceSunken: '#06120a',
      primary: '#4ade80',
      primaryLight: '#86efac',
      primaryDark: '#22c55e',
      primarySoft: '#14532d',
      onPrimary: '#052e16',
      textPrimary: '#ecfdf3',
      textSecondary: '#c3e3cf',
      textMuted: '#8fb49f',
      border: '#1f3a2a',
      borderStrong: '#2b4d38',
      ...SEM_DARK,
      income: '#5eead4',
      incomeLight: '#134e4a',
      expense: '#fdba74',
      expenseLight: '#7c2d12',
      overlay: 'rgba(3, 10, 6, 0.7)',
      skeleton: '#1a3324',
    }),
    chart: {
      light: ['#166534', '#047857', '#c2410c', '#a16207', '#1d4ed8', '#7c3aed', '#0e7490', '#be185d'],
      dark: ['#4ade80', '#5eead4', '#fdba74', '#fcd34d', '#93c5fd', '#c4b5fd', '#67e8f9', '#f9a8d4'],
    },
  },

  midnight: {
    id: 'midnight',
    light: tokens({
      bg: '#f1f5f9',
      surface: '#ffffff',
      surfaceAlt: '#f8fafc',
      surfaceSunken: '#e2e8f0',
      primary: '#334155',
      primaryLight: '#64748b',
      primaryDark: '#1e293b',
      primarySoft: '#e2e8f0',
      onPrimary: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#4f6076',
      border: '#cbd5e1',
      borderStrong: '#94a3b8',
      ...SEM_LIGHT,
      overlay: 'rgba(15, 23, 42, 0.5)',
      skeleton: '#cbd5e1',
    }),
    dark: tokens({
      bg: '#000000',
      surface: '#0d0d0f',
      surfaceAlt: '#161618',
      surfaceSunken: '#000000',
      primary: '#a5b4fc',
      primaryLight: '#c7d2fe',
      primaryDark: '#818cf8',
      primarySoft: '#1e1b4b',
      onPrimary: '#0b0a2a',
      textPrimary: '#f4f4f5',
      textSecondary: '#c4c4cc',
      textMuted: '#9a9aa6',
      border: '#222226',
      borderStrong: '#333338',
      ...SEM_DARK,
      overlay: 'rgba(0, 0, 0, 0.75)',
      skeleton: '#1a1a1e',
    }),
    chart: {
      light: ['#334155', '#1d4ed8', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#15803d', '#ec4899'],
      dark: ['#a5b4fc', '#60a5fa', '#fbbf24', '#f87171', '#c4b5fd', '#67e8f9', '#4ade80', '#f9a8d4'],
    },
  },

  sunset: {
    id: 'sunset',
    light: tokens({
      bg: '#fff8f1',
      surface: '#ffffff',
      surfaceAlt: '#fffbf6',
      surfaceSunken: '#fdecdc',
      primary: '#c2410c',
      primaryLight: '#f97316',
      primaryDark: '#9a3412',
      primarySoft: '#ffedd5',
      onPrimary: '#ffffff',
      textPrimary: '#2b1a12',
      textSecondary: '#6b4a3a',
      textMuted: '#7d5c4b',
      border: '#f3dccb',
      borderStrong: '#e6c2a7',
      ...SEM_LIGHT,
      expense: '#be123c',
      expenseLight: '#ffe4e6',
      warning: '#a16207',
      warningLight: '#fef9c3',
      overlay: 'rgba(43, 26, 18, 0.45)',
      skeleton: '#f3dccb',
    }),
    dark: tokens({
      bg: '#1a100b',
      surface: '#261812',
      surfaceAlt: '#32201a',
      surfaceSunken: '#110a06',
      primary: '#fb923c',
      primaryLight: '#fdba74',
      primaryDark: '#f97316',
      primarySoft: '#4a2a14',
      onPrimary: '#2a1205',
      textPrimary: '#fff5ee',
      textSecondary: '#f0d6c5',
      textMuted: '#c9a58f',
      border: '#3d2a20',
      borderStrong: '#52382b',
      ...SEM_DARK,
      expense: '#fda4af',
      expenseLight: '#881337',
      warning: '#fcd34d',
      overlay: 'rgba(8, 4, 2, 0.7)',
      skeleton: '#3a271d',
    }),
    chart: {
      light: ['#c2410c', '#a16207', '#be123c', '#7c3aed', '#1d4ed8', '#15803d', '#0e7490', '#be185d'],
      dark: ['#fb923c', '#fcd34d', '#fda4af', '#c4b5fd', '#93c5fd', '#4ade80', '#67e8f9', '#f9a8d4'],
    },
  },

  lavender: {
    id: 'lavender',
    light: tokens({
      bg: '#f7f5ff',
      surface: '#ffffff',
      surfaceAlt: '#fbfaff',
      surfaceSunken: '#ebe7fb',
      primary: '#6d28d9',
      primaryLight: '#8b5cf6',
      primaryDark: '#5b21b6',
      primarySoft: '#ede9fe',
      onPrimary: '#ffffff',
      textPrimary: '#1e1536',
      textSecondary: '#4b4169',
      textMuted: '#625a80',
      border: '#e0daf5',
      borderStrong: '#c6bce8',
      ...SEM_LIGHT,
      adjustment: '#0e7490',
      adjustmentLight: '#cffafe',
      overlay: 'rgba(30, 21, 54, 0.45)',
      skeleton: '#e0daf5',
    }),
    dark: tokens({
      bg: '#110c1f',
      surface: '#1a1430',
      surfaceAlt: '#241c40',
      surfaceSunken: '#0a0716',
      primary: '#c4b5fd',
      primaryLight: '#ddd6fe',
      primaryDark: '#a78bfa',
      primarySoft: '#2e1065',
      onPrimary: '#1e1140',
      textPrimary: '#f5f3ff',
      textSecondary: '#d6d0ea',
      textMuted: '#a79fc4',
      border: '#2d2448',
      borderStrong: '#3e335f',
      ...SEM_DARK,
      adjustment: '#67e8f9',
      adjustmentLight: '#164e63',
      overlay: 'rgba(5, 3, 12, 0.7)',
      skeleton: '#2a2145',
    }),
    chart: {
      light: ['#6d28d9', '#0e7490', '#f59e0b', '#ef4444', '#1d4ed8', '#ec4899', '#15803d', '#f97316'],
      dark: ['#c4b5fd', '#67e8f9', '#fbbf24', '#f87171', '#60a5fa', '#f9a8d4', '#4ade80', '#fdba74'],
    },
  },
};

export const PALETTE_IDS: PaletteId[] = [
  'default',
  'pastel',
  'mono',
  'ocean',
  'forest',
  'midnight',
  'sunset',
  'lavender',
];

export const DEFAULT_PALETTE: PaletteId = 'default';

export function isPaletteId(x: unknown): x is PaletteId {
  return typeof x === 'string' && (PALETTE_IDS as string[]).includes(x);
}

export function resolveColors(palette: PaletteId, resolved: Resolved): ColorTokens {
  const p = PALETTES[palette] ?? PALETTES.default;
  return resolved === 'dark' ? p.dark : p.light;
}

/** Categorical chart palette, ordered by hue distance so adjacent slices differ. */
export function chartPalette(resolved: Resolved, palette: PaletteId = DEFAULT_PALETTE): string[] {
  const p = PALETTES[palette] ?? PALETTES.default;
  return resolved === 'dark' ? p.chart.dark : p.chart.light;
}

export function chartMuted(resolved: Resolved): string {
  return resolved === 'dark' ? '#64748b' : '#94a3b8';
}

// Legacy named exports. New code reads colors through `useTheme()`.
export const lightColors: ColorTokens = PALETTES.default.light;
export const darkColors: ColorTokens = PALETTES.default.dark;

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
 * them 1:1 so text blocks keep a predictable height. `input` is the floor for
 * any text field: iOS Safari zooms the page when a focused input is smaller.
 */
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 16,
  input: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 34,
  hero: 44,
};

export const lineHeight = {
  xs: 16,
  sm: 18,
  md: 22,
  input: 22,
  lg: 25,
  xl: 26,
  xxl: 30,
  display: 40,
  hero: 50,
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
 * Elevation levels 0-4. Shadows read as depth on light backgrounds; on dark the
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

// Legacy alias, same values as elevation[2].
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
