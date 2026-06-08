import { Account, Transaction } from './storage';
import { isoDay } from './format';

export type Period = 'day' | 'month' | 'year';

export function accountBalance(account: Account, txs: Transaction[]): number {
  let delta = 0;
  for (const t of txs) {
    if (t.type === 'transfer') {
      if (t.accountId === account.id) delta -= t.amount; 
      if (t.toAccountId === account.id) delta += t.amount; 
    } 
    else if (t.accountId === account.id) {
      delta += t.type === 'income' ? t.amount : -t.amount;
    }
  }
  return account.startingBalance + delta;
}

export function filterByPeriod(txs: Transaction[], period: Period, ref: Date = new Date()): Transaction[] {
  const refKey = isoDay(ref);
  if (period === 'day') {
    return txs.filter((t) => t.dayKey === refKey);
  }
  if (period === 'month') {
    const prefix = refKey.slice(0, 7); // YYYY-MM
    return txs.filter((t) => t.dayKey.startsWith(prefix));
  }
  const prefix = refKey.slice(0, 4); // YYYY
  return txs.filter((t) => t.dayKey.startsWith(prefix));
}

export interface CategorySum {
  categoryId: string;
  total: number;
}

export function sumByCategory(txs: Transaction[], type: 'income' | 'expense' | 'transfer'): CategorySum[] {
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
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expense += t.amount;
    }
  }
  return { income, expense, net: income - expense };
}