import { Platform, Share } from 'react-native';
import { Account, Transaction } from './storage';
import { downloadTextOnWeb } from './webShare';

export interface CsvLabels {
  date: string;
  time: string;
  type: string;
  category: string;
  account: string;
  toAccount: string;
  amount: string;
  note: string;
}

function cell(v: string | number): string {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Plain CSV, one row per transaction, newest first. Amounts are signed the
 * way the balance sees them (expense and adjustments out are negative;
 * transfers stay positive with both accounts named).
 */
export function buildCsv(
  txs: Transaction[],
  accounts: Account[],
  categoryName: (id: string) => string,
  typeName: (type: Transaction['type']) => string,
  labels: CsvLabels,
): string {
  const accountsById = new Map(accounts.map((a) => [a.id, a.name] as const));
  const header = [labels.date, labels.time, labels.type, labels.category, labels.account, labels.toAccount, labels.amount, labels.note];
  const rows = txs.map((tx) => {
    const d = new Date(tx.date);
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const sign = tx.type === 'expense' || (tx.type === 'adjustment' && tx.direction !== 'in') ? -1 : 1;
    const category = tx.type === 'transfer' || tx.type === 'adjustment' ? '' : categoryName(tx.categoryId);
    return [
      tx.dayKey,
      time,
      typeName(tx.type),
      category,
      accountsById.get(tx.accountId) ?? tx.accountId,
      tx.toAccountId ? accountsById.get(tx.toAccountId) ?? tx.toAccountId : '',
      sign * tx.amount,
      tx.note,
    ].map(cell).join(',');
  });
  // BOM so Excel opens UTF-8 names correctly.
  return '﻿' + [header.map(cell).join(','), ...rows].join('\r\n');
}

/** Download on web, share sheet on native. Returns true when the user got the file. */
export async function shareCsv(filename: string, csv: string, title: string): Promise<boolean> {
  if (Platform.OS === 'web') return downloadTextOnWeb(filename, csv, 'text/csv;charset=utf-8');
  const res = await Share.share({ message: csv, title });
  return res.action !== Share.dismissedAction;
}
