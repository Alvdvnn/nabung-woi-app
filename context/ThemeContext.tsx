import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { Appearance, Platform } from 'react-native';
import {
  ColorTokens,
  DEFAULT_PALETTE,
  PaletteId,
  Resolved,
  chartPalette,
  resolveColors,
} from '../constants/theme';
import { getTheme, setTheme as persistTheme, StoredThemeMode } from '../utils/storage';

export type ThemeMode = StoredThemeMode;
export type { Resolved, PaletteId };

interface ThemeContextValue {
  colors: ColorTokens;
  /** Categorical chart colors for the active palette and mode. */
  chart: string[];
  palette: PaletteId;
  mode: ThemeMode;
  resolved: Resolved;
  setMode: (mode: ThemeMode) => Promise<void>;
  setPalette: (palette: PaletteId) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function currentSystemScheme(): Resolved {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

/**
 * Web only: keep the browser chrome in step with the app. `theme-color` tints
 * the iOS standalone status bar and Android's address bar; the body color is
 * what shows through behind safe areas and during route transitions.
 */
function syncWebChrome(bg: string, resolved: Resolved) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = bg;
  document.body.style.backgroundColor = bg;
  document.documentElement.style.backgroundColor = bg;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);
  const [systemScheme, setSystemScheme] = useState<Resolved>(currentSystemScheme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getTheme().then((stored) => {
      setModeState(stored.mode);
      setPaletteState(stored.palette);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback(
    async (next: ThemeMode) => {
      setModeState(next);
      await persistTheme({ palette, mode: next });
    },
    [palette],
  );

  const setPalette = useCallback(
    async (next: PaletteId) => {
      setPaletteState(next);
      await persistTheme({ palette: next, mode });
    },
    [mode],
  );

  const resolved: Resolved = mode === 'system' ? systemScheme : mode;
  const colors = useMemo(() => resolveColors(palette, resolved), [palette, resolved]);
  const chart = useMemo(() => chartPalette(resolved, palette), [palette, resolved]);

  useEffect(() => {
    syncWebChrome(colors.bg, resolved);
  }, [colors.bg, resolved]);

  // Render eagerly with defaults so sibling providers can hydrate in parallel.
  // The splash screen covers the brief window before stored theme is loaded.
  void hydrated;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, chart, palette, mode, resolved, setMode, setPalette }),
    [colors, chart, palette, mode, resolved, setMode, setPalette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
