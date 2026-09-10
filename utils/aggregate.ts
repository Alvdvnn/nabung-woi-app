import { Account, Transaction } from './storage';
import { isoDay } from './date';
import { DateRange } from './period';

export type Period = 'day' | 'month' | 'year';

/** Signed effect of one transaction on one account's balance. */
export function balanceDelta(tx: Transaction, accountId: string): number {
  switch (tx.type) {
    case 'transfer':
      if (tx.accountId === accountId) return -tx.amount;
      if (tx.toAccountId === accountId) return tx.amount;
      return 0;
    case 'adjustment':
      if (tx.accountId !== accountId) return 0;
      return tx.direction === 'in' ? tx.amount : -tx.amount;
    case 'income':
      return tx.accountId === accountId ? tx.amount : 0;
    case 'expense':
      return tx.accountId === accountId ? -tx.amount : 0;
    default:
      return 0;
  }
}

/** Balances for every account in one pass instead of one pass per account. */
export function accountBalances(accounts: Account[], txs: Transaction[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const a of accounts) out.set(a.id, a.startingBalance);
  for (const t of txs) {
    if (t.type === 'transfer') {
      if (out.has(t.accountId)) out.set(t.accountId, out.get(t.accountId)! - t.amount);
      if (t.toAccountId && out.has(t.toAccountId)) {
        out.set(t.toAccountId, out.get(t.toAccountId)! + t.amount);
      }
      continue;
    }
    if (!out.has(t.accountId)) continue;
    out.set(t.accountId, out.get(t.accountId)! + balanceDelta(t, t.accountId));
  }
  return out;
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

/** Range filter in dayKey space — works for any granularity, including weeks. */
export function filterByRange(txs: Transaction[], range: DateRange): Transaction[] {
  return txs.filter((t) => t.dayKey >= range.startKey && t.dayKey <= range.endKey);
}

export interface CategorySum {
  categoryId: string;
  total: number;
}

export function sumByCategory(txs: Transaction[], type: 'income' | 'expense'): CategorySum[] {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

/**
 * Cashflow totals. Transfers move money between the user's own accounts and
 * adjustments are bookkeeping corrections — neither is income or spending, so
 * both are excluded here and only affect account balances.
 */
export function totalsOf(txs: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

export interface AdjustmentTotals {
  in: number;
  out: number;
  net: number;
  count: number;
}

export function adjustmentTotals(txs: Transaction[]): AdjustmentTotals {
  let inc = 0;
  let out = 0;
  let count = 0;
  for (const t of txs) {
    if (t.type !== 'adjustment') continue;
    count += 1;
    if (t.direction === 'in') inc += t.amount;
    else out += t.amount;
  }
  return { in: inc, out, net: inc - out, count };
}
