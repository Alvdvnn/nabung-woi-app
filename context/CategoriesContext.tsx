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
    return {
      customCats,
      refresh,
      byType: (type) => {
        const defaults = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const extras = customCats.filter((c) => c.type === type).map(customToDef);
        return [...defaults.map(localize), ...extras];
      },
      find: (id) => {
        const builtin = ALL_CATEGORIES.find((c) => c.id === id);
        if (builtin) return localize(builtin);
        const custom = customCats.find((c) => c.id === id);
        return custom ? customToDef(custom) : undefined;
      },
    };
  }, [customCats, refresh, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategories(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCategories must be used inside CategoriesProvider');
  return v;
}
