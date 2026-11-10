import { Transaction, TransactionType } from '../../utils/storage';

export type HistoryTypeFilter = 'all' | TransactionType;

export interface HistoryFilters {
  type: HistoryTypeFilter;
  accountId?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const EMPTY_FILTERS: HistoryFilters = { type: 'all' };

export function activeFilterCount(f: HistoryFilters): number {
  let n = 0;
  if (f.type !== 'all') n += 1;
  if (f.accountId) n += 1;
  if (f.categoryId) n += 1;
  if (f.minAmount !== undefined || f.maxAmount !== undefined) n += 1;
  return n;
}

/** Applies every non-range filter. Search runs separately (needs category names). */
export function matchesFilters(tx: Transaction, f: HistoryFilters): boolean {
  if (f.type !== 'all' && tx.type !== f.type) return false;
  if (f.accountId && tx.accountId !== f.accountId && tx.toAccountId !== f.accountId) return false;
  if (f.categoryId && tx.categoryId !== f.categoryId) return false;
  if (f.minAmount !== undefined && tx.amount < f.minAmount) return false;
  if (f.maxAmount !== undefined && tx.amount > f.maxAmount) return false;
  return true;
}
