import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getThemeMode().then((stored) => {
      setModeState(stored);
      setHydrated(true);
    });
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await setThemeMode(next);
  }, []);

  const resolved: Resolved = mode;
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
