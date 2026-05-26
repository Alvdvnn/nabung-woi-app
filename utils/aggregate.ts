import { Transaction } from './storage';

export type Period = 'day' | 'month' | 'year';

export function filterByPeriod(txs: Transaction[], period: Period, ref: Date = new Date()): Transaction[] {
  return txs.filter((t) => {
    const d = new Date(t.date);
    if (period === 'day') {
      return (
        d.getFullYear() === ref.getFullYear() &&
        d.getMonth() === ref.getMonth() &&
        d.getDate() === ref.getDate()
      );
    }
    if (period === 'month') {
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    }
    return d.getFullYear() === ref.getFullYear();
  });
}

export interface CategorySum {
  categoryId: string;
  total: number;
}

export function sumByCategory(txs: Transaction[], type: 'income' | 'expense'): CategorySum[] {
  const map = new Map<string, number>();
  txs
    .filter((t) => t.type === type)
    .forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
  return Array.from(map.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalsOf(txs: Transaction[]): { income: number; expense: number; net: number } {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}
