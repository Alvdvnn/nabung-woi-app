import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  CategoryDef,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  customToDef,
  findCategory as findCategoryStatic,
} from '../constants/categories';
import { CustomCategory, getCustomCategories, TransactionType } from '../utils/storage';

interface Value {
  customCats: CustomCategory[];
  refresh: () => Promise<void>;
  byType: (t: TransactionType) => CategoryDef[];
  find: (id: string) => CategoryDef | undefined;
}

const Ctx = createContext<Value | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);

  const refresh = useCallback(async () => {
    const list = await getCustomCategories();
    setCustomCats(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<Value>(() => ({
    customCats,
    refresh,
    byType: (t) => {
      const defaults = t === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const extras = customCats.filter((c) => c.type === t).map(customToDef);
      return [...defaults, ...extras];
    },
    find: (id) => findCategoryStatic(id, customCats),
  }), [customCats, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategories(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCategories must be used inside CategoriesProvider');
  return v;
}
