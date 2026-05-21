import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { DICTS, en, Locale } from './dicts';
import { getLocale, setLocale as persistLocale } from '../utils/storage';

type Dict = typeof en;

export type TFn = <K1 extends keyof Dict, K2 extends keyof Dict[K1]>(
  path: `${K1 & string}.${K2 & string}`,
  vars?: Record<string, string | number>,
) => Dict[K1][K2] extends string ? string : Dict[K1][K2];

interface LocaleContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => Promise<void>;
  t: TFn;
}

const Ctx = createContext<LocaleContextValue | null>(null);

let _currentLocale: Locale = 'en';
export function getCurrentLocale(): Locale {
  return _currentLocale;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function lookup(dict: Dict, path: string): unknown {
  const [a, b] = path.split('.') as [keyof Dict, string];
  const branch = dict[a] as Record<string, unknown> | undefined;
  return branch ? branch[b] : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getLocale().then((loc) => {
      _currentLocale = loc;
      setLocaleState(loc);
      setHydrated(true);
    });
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    _currentLocale = next;
    setLocaleState(next);
    await persistLocale(next);
  }, []);

  const t = useCallback<TFn>(
    ((path: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale];
      const raw = lookup(dict, path);
      if (typeof raw === 'string') return interpolate(raw, vars);
      return raw as unknown;
    }) as TFn,
    [locale],
  );

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  if (!hydrated) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLocale must be used inside LocaleProvider');
  return v;
}

export function useT(): TFn {
  return useLocale().t;
}
