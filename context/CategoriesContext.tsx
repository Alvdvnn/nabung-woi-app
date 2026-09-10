import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  CategoryDef,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ALL_CATEGORIES,
  customToDef,
} from '../constants/categories';
import { CustomCategory, getCustomCategories, TransactionType } from '../utils/storage';
import { useT } from '../i18n';
import { tBuiltin } from '../i18n/labels';

interface Value {
  customCats: CustomCategory[];
  refresh: () => Promise<void>;
  byType: (t: TransactionType) => CategoryDef[];
  find: (id: string) => CategoryDef | undefined;
}

const Ctx = createContext<Value | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const t = useT();

  const refresh = useCallback(async () => {
    const list = await getCustomCategories();
    setCustomCats(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<Value>(() => {
    const localize = (def: CategoryDef): CategoryDef => ({
      ...def,
      name: tBuiltin(t, 'categories', def.id),
    });

    // `find` runs once per rendered transaction row, so it resolves through a
    // prebuilt index instead of scanning the builtin + custom arrays each time.
    const index = new Map<string, CategoryDef>();
    for (const def of ALL_CATEGORIES) index.set(def.id, localize(def));
    for (const custom of customCats) index.set(custom.id, customToDef(custom));

    const expense: CategoryDef[] = [];
    const income: CategoryDef[] = [];
    for (const def of EXPENSE_CATEGORIES) expense.push(index.get(def.id) ?? localize(def));
    for (const def of INCOME_CATEGORIES) income.push(index.get(def.id) ?? localize(def));
    for (const custom of customCats) {
      const def = index.get(custom.id);
      if (!def) continue;
      (custom.type === 'expense' ? expense : income).push(def);
    }

    return {
      customCats,
      refresh,
      byType: (type) => (type === 'expense' ? expense : income),
      find: (id) => index.get(id),
    };
  }, [customCats, refresh, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategories(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCategories must be used inside CategoriesProvider');
  return v;
}
