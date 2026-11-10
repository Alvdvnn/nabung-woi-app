import { useMemo } from 'react';
import { CategoryDef } from '../constants/categories';
import { Transaction } from '../utils/storage';
import { addDays, isoDay } from '../utils/date';

const WINDOW_DAYS = 90;

export interface CategoryUsage {
  /** Transactions in the last 90 days, by category. */
  recent: Map<string, number>;
  /** All-time count, by category. */
  total: Map<string, number>;
  /** Newest `date` seen, by category. */
  lastUsed: Map<string, string>;
}

/** One pass over the list; cheap enough to recompute whenever txs change. */
export function useCategoryUsage(txs: Transaction[]): CategoryUsage {
  return useMemo(() => {
    const cutoff = isoDay(addDays(new Date(), -WINDOW_DAYS));
    const recent = new Map<string, number>();
    const total = new Map<string, number>();
    const lastUsed = new Map<string, string>();
    for (const tx of txs) {
      if (tx.type !== 'income' && tx.type !== 'expense') continue;
      total.set(tx.categoryId, (total.get(tx.categoryId) ?? 0) + 1);
      if (tx.dayKey >= cutoff) recent.set(tx.categoryId, (recent.get(tx.categoryId) ?? 0) + 1);
      const prev = lastUsed.get(tx.categoryId);
      if (!prev || tx.date > prev) lastUsed.set(tx.categoryId, tx.date);
    }
    return { recent, total, lastUsed };
  }, [txs]);
}

/** Most used recently first, then most recently used, then the default order. */
export function sortByUsage(categories: CategoryDef[], usage: CategoryUsage): CategoryDef[] {
  return categories
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const ra = usage.recent.get(a.c.id) ?? 0;
      const rb = usage.recent.get(b.c.id) ?? 0;
      if (ra !== rb) return rb - ra;
      const la = usage.lastUsed.get(a.c.id) ?? '';
      const lb = usage.lastUsed.get(b.c.id) ?? '';
      if (la !== lb) return la < lb ? 1 : -1;
      return a.i - b.i;
    })
    .map((x) => x.c);
}
