export const lightColors = {
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#0d9488',
  primaryLight: '#14b8a6',
  primarySoft: '#ccfbf1',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e5e7eb',
  borderStrong: '#cbd5e1',
  income: '#16a34a',
  incomeLight: '#dcfce7',
  expense: '#dc2626',
  expenseLight: '#fee2e2',
  warning: '#f59e0b',
  white: '#ffffff',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

export const darkColors: typeof lightColors = {
  bg: '#0b1220',
  card: '#111827',
  primary: '#2dd4bf',
  primaryLight: '#5eead4',
  primarySoft: '#134e4a',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#1f2937',
  borderStrong: '#334155',
  income: '#22c55e',
  incomeLight: '#14532d',
  expense: '#ef4444',
  expenseLight: '#7f1d1d',
  warning: '#fbbf24',
  white: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export type ColorTokens = typeof lightColors;


export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 32,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};
