import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  Budget,
  DEFAULT_PREFS,
  Prefs,
  getBudgets as storageGetBudgets,
  getPrefs as storageGetPrefs,
  saveBudgets as storageSaveBudgets,
  setPrefs as storageSetPrefs,
} from '../utils/storage';
import { setHapticsEnabled } from '../utils/haptics';
import { setWeekStart } from '../utils/date';

interface PrefsContextValue {
  prefs: Prefs;
  budgets: Budget[];
  /** categoryId -> monthly budget, for O(1) lookups in rows. */
  budgetsByCategory: Map<string, number>;
  hydrated: boolean;
  updatePrefs: (patch: Partial<Prefs>) => Promise<void>;
  setBudget: (categoryId: string, monthly: number | null) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PrefsContextValue | null>(null);

/**
 * Small persisted settings that several screens read: week start, haptics,
 * auto-lock, default account, backup timestamps, and per-category budgets.
 * Kept separate from DataContext so a preference change never rebuilds the
 * transaction indexes.
 */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const prefsRef = useRef(prefs);
  const budgetsRef = useRef(budgets);

  useEffect(() => { prefsRef.current = prefs; }, [prefs]);
  useEffect(() => { budgetsRef.current = budgets; }, [budgets]);

  // Non-React modules (date math, haptics) read these through module setters.
  useEffect(() => { setWeekStart(prefs.weekStart); }, [prefs.weekStart]);
  useEffect(() => { setHapticsEnabled(prefs.haptics); }, [prefs.haptics]);

  const refresh = useCallback(async () => {
    const [p, b] = await Promise.all([storageGetPrefs(), storageGetBudgets()]);
    setPrefsState(p);
    setBudgets(b);
  }, []);

  useEffect(() => {
    refresh().finally(() => setHydrated(true));
  }, [refresh]);

  const updatePrefs = useCallback(async (patch: Partial<Prefs>) => {
    const prev = prefsRef.current;
    const next = { ...prev, ...patch };
    setPrefsState(next);
    try {
      await storageSetPrefs(next);
    } catch (err) {
      setPrefsState(prev);
      throw err;
    }
  }, []);

  const setBudget = useCallback(async (categoryId: string, monthly: number | null) => {
    const prev = budgetsRef.current;
    const without = prev.filter((b) => b.categoryId !== categoryId);
    const next = monthly && monthly > 0 ? [...without, { categoryId, monthly }] : without;
    setBudgets(next);
    try {
      await storageSaveBudgets(next);
    } catch (err) {
      setBudgets(prev);
      throw err;
    }
  }, []);

  const budgetsByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of budgets) m.set(b.categoryId, b.monthly);
    return m;
  }, [budgets]);

  const value = useMemo<PrefsContextValue>(
    () => ({ prefs, budgets, budgetsByCategory, hydrated, updatePrefs, setBudget, refresh }),
    [prefs, budgets, budgetsByCategory, hydrated, updatePrefs, setBudget, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrefs must be used inside PrefsProvider');
  return v;
}
