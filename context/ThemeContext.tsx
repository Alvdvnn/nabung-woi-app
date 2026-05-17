import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { lightColors, darkColors, ColorTokens } from '../constants/theme';
import { getThemeMode, setThemeMode, StoredThemeMode } from '../utils/storage';

export type ThemeMode = StoredThemeMode;
export type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorTokens;
  mode: ThemeMode;
  resolved: Resolved;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(mode: ThemeMode, system: ColorSchemeName): Resolved {
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getThemeMode().then((stored) => {
      setModeState(stored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (mode !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, [mode]);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await setThemeMode(next);
  }, []);

  const resolved = resolveScheme(mode, systemScheme);
  const colors = resolved === 'dark' ? darkColors : lightColors;

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={{ colors, mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
