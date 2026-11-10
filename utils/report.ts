import { Account, Transaction } from './storage';
import {
  AdjustmentTotals,
  CategorySum,
  Totals,
  balanceDelta,
} from './aggregate';
import { Bucket, DateRange, bucketsFor, isCurrentRange, previousRange, rangeLength, shiftRange } from './period';
import { isoDay, parseIsoDay } from './date';

export interface ReportBucket extends Bucket {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface AccountReport {
  accountId: string;
  name: string;
  typeId: string;
  income: number;
  expense: number;
  net: number;
  /** Balance as of now, across all time, not just the report range. */
  balance: number;
}

export interface Delta {
  /** Percent change vs the previous period, or null when there's no baseline. */
  percent: number | null;
  absolute: number;
}

/** Progress against a monthly budget for one expense category. */
export interface BudgetProgress {
  categoryId: string;
  budget: number;
  spent: number;
  /** spent / budget, may exceed 1. */
  ratio: number;
}

/** Spending pace for the current period: how far along it is and where it lands at this rate. */
export interface Pace {
  daysElapsed: number;
  daysInRange: number;
  spent: number;
  perDay: number;
  projected: number;
}

/** One earlier period of the same granularity, oldest first. */
export interface TrendPoint {
  startKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  /** 0..100 or null when there was no income. */
  savingsRate: number | null;
  current: boolean;
}

export interface ReportData {
  range: DateRange;
  totals: Totals;
  previousTotals: Totals;
  deltas: { income: Delta; expense: Delta; net: Delta };
  /** Share of income kept, 0..100. Null when there was no income. */
  savingsRate: number | null;
  avgIncomePerDay: number;
  avgExpensePerDay: number;
  avgExpensePerTx: number;
  txCount: number;
  daysLogged: number;
  daysInRange: number;
  busiestDay: { dayKey: string; total: number } | null;
  buckets: ReportBucket[];
  expenseByCategory: CategorySum[];
  incomeByCategory: CategorySum[];
  byAccount: AccountReport[];
  topExpenses: Transaction[];
  adjustments: AdjustmentTotals;
  /** Only for month ranges (budgets are monthly). Sorted by ratio desc. */
  budgets: BudgetProgress[];
  /** Only when the range contains today and spans more than one day. */
  pace: Pace | null;
  /** The last `trendPeriods` ranges including this one, oldest first. */
  trend: TrendPoint[];
  isEmpty: boolean;
}

const TOP_EXPENSE_COUNT = 5;

function delta(current: number, previous: number): Delta {
  const absolute = current - previous;
  return {
    absolute,
    percent: previous > 0 ? (absolute / previous) * 100 : null,
  };
}

function sortedSums(map: Map<string, number>): CategorySum[] {
  return Array.from(map.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

function trendLabel(range: DateRange, monthNames: readonly string[]): string {
  switch (range.granularity) {
    case 'day':
      return String(range.start.getDate());
    case 'week':
      return `${range.start.getDate()}/${range.start.getMonth() + 1}`;
    case 'year':
      return String(range.start.getFullYear());
    case 'month':
    default:
      return (monthNames[range.start.getMonth()] ?? '').slice(0, 3);
  }
}

/**
 * Everything the Report and Dashboard render, computed in a single pass over
 * the transaction list (plus one short pass for the trend windows).
 *
 * Rules shared with the rest of the app: transfers and adjustments never count
 * as income or expense; they only move balances.
 */
export function buildReport(opts: {
  txs: Transaction[];
  accounts: Account[];
  range: DateRange;
  monthNames: readonly string[];
  /** categoryId -> monthly budget. */
  budgets?: Map<string, number>;
  /** How many periods (including this one) to include in `trend`. 0 = none. */
  trendPeriods?: number;
  today?: Date;
}): ReportData {
  const { txs, accounts, range, monthNames } = opts;
  const today = opts.today ?? new Date();
  const prev = previousRange(range);

  const buckets: ReportBucket[] = bucketsFor(range, monthNames).map((b) => ({
    ...b,
    income: 0,
    expense: 0,
    net: 0,
    count: 0,
  }));
  const bucketIndex = new Map<string, number>();
  buckets.forEach((b, i) => bucketIndex.set(b.key, i));
  const byMonth = buckets.length > 0 && buckets[0].monthly;

  const balances = new Map<string, number>();
  const accountRows = new Map<string, AccountReport>();
  for (const a of accounts) {
    balances.set(a.id, a.startingBalance);
    accountRows.set(a.id, {
      accountId: a.id,
      name: a.name,
      typeId: a.typeId,
      income: 0,
      expense: 0,
      net: 0,
      balance: a.startingBalance,
    });
  }

  const expenseCats = new Map<string, number>();
  const incomeCats = new Map<string, number>();
  const perDayExpense = new Map<string, number>();
  const loggedDays = new Set<string>();
  const topExpenses: Transaction[] = [];

  let income = 0;
  let expense = 0;
  let prevIncome = 0;
  let prevExpense = 0;
  let txCount = 0;
  let expenseTxCount = 0;
  let adjIn = 0;
  let adjOut = 0;
  let adjCount = 0;

  for (const tx of txs) {
    // Balances always span all time, so they accumulate outside the range check.
    if (balances.has(tx.accountId) || (tx.toAccountId && balances.has(tx.toAccountId))) {
      if (balances.has(tx.accountId)) {
        balances.set(tx.accountId, balances.get(tx.accountId)! + balanceDelta(tx, tx.accountId));
      }
      if (tx.type === 'transfer' && tx.toAccountId && balances.has(tx.toAccountId)) {
        balances.set(tx.toAccountId, balances.get(tx.toAccountId)! + tx.amount);
      }
    }

    const key = tx.dayKey;
    if (key >= prev.startKey && key <= prev.endKey) {
      if (tx.type === 'income') prevIncome += tx.amount;
      else if (tx.type === 'expense') prevExpense += tx.amount;
    }

    if (key < range.startKey || key > range.endKey) continue;

    txCount += 1;
    loggedDays.add(key);

    const bucketKey = byMonth ? key.slice(0, 7) : key;
    const bi = bucketIndex.get(bucketKey);
    if (bi !== undefined) buckets[bi].count += 1;

    const row = accountRows.get(tx.accountId);

    if (tx.type === 'adjustment') {
      adjCount += 1;
      if (tx.direction === 'in') adjIn += tx.amount;
      else adjOut += tx.amount;
      continue;
    }

    if (tx.type === 'transfer') continue;

    if (tx.type === 'income') {
      income += tx.amount;
      incomeCats.set(tx.categoryId, (incomeCats.get(tx.categoryId) ?? 0) + tx.amount);
      if (row) {
        row.income += tx.amount;
        row.net += tx.amount;
      }
    } else {
      expense += tx.amount;
      expenseTxCount += 1;
      expenseCats.set(tx.categoryId, (expenseCats.get(tx.categoryId) ?? 0) + tx.amount);
      perDayExpense.set(key, (perDayExpense.get(key) ?? 0) + tx.amount);
      if (row) {
        row.expense += tx.amount;
        row.net -= tx.amount;
      }
      topExpenses.push(tx);
    }

    if (bi !== undefined) {
      const bucket = buckets[bi];
      if (tx.type === 'income') bucket.income += tx.amount;
      else bucket.expense += tx.amount;
      bucket.net = bucket.income - bucket.expense;
    }
  }

  for (const row of accountRows.values()) {
    row.balance = balances.get(row.accountId) ?? row.balance;
  }

  let busiestDay: ReportData['busiestDay'] = null;
  for (const [dayKey, total] of perDayExpense) {
    if (!busiestDay || total > busiestDay.total) busiestDay = { dayKey, total };
  }

  topExpenses.sort((a, b) => b.amount - a.amount);

  const daysInRange = rangeLength(range);
  const totals: Totals = { income, expense, net: income - expense };
  const previousTotals: Totals = {
    income: prevIncome,
    expense: prevExpense,
    net: prevIncome - prevExpense,
  };

  // Budgets are monthly, so progress is only meaningful on a month range.
  const budgets: BudgetProgress[] = [];
  if (opts.budgets && opts.budgets.size > 0 && range.granularity === 'month') {
    for (const [categoryId, budget] of opts.budgets) {
      if (budget <= 0) continue;
      const spent = expenseCats.get(categoryId) ?? 0;
      budgets.push({ categoryId, budget, spent, ratio: spent / budget });
    }
    budgets.sort((a, b) => b.ratio - a.ratio);
  }

  let pace: Pace | null = null;
  if (daysInRange > 1 && isCurrentRange(range, today)) {
    const daysElapsed = Math.max(
      1,
      Math.round((parseIsoDay(isoDay(today)).getTime() - parseIsoDay(range.startKey).getTime()) / 86_400_000) + 1,
    );
    const perDay = expense / daysElapsed;
    pace = { daysElapsed, daysInRange, spent: expense, perDay, projected: perDay * daysInRange };
  }

  // Trend windows: this range and the N-1 before it. Short second pass.
  const trend: TrendPoint[] = [];
  const n = opts.trendPeriods ?? 0;
  if (n > 0) {
    const windows: DateRange[] = [range];
    for (let i = 1; i < n; i++) windows.unshift(shiftRange(windows[0], -1));
    const inc = new Array<number>(windows.length).fill(0);
    const exp = new Array<number>(windows.length).fill(0);
    const first = windows[0].startKey;
    const last = windows[windows.length - 1].endKey;
    for (const tx of txs) {
      if (tx.type !== 'income' && tx.type !== 'expense') continue;
      const key = tx.dayKey;
      if (key < first || key > last) continue;
      for (let i = 0; i < windows.length; i++) {
        if (key >= windows[i].startKey && key <= windows[i].endKey) {
          if (tx.type === 'income') inc[i] += tx.amount;
          else exp[i] += tx.amount;
          break;
        }
      }
    }
    windows.forEach((w, i) => {
      trend.push({
        startKey: w.startKey,
        label: trendLabel(w, monthNames),
        income: inc[i],
        expense: exp[i],
        net: inc[i] - exp[i],
        savingsRate: inc[i] > 0 ? ((inc[i] - exp[i]) / inc[i]) * 100 : null,
        current: i === windows.length - 1,
      });
    });
  }

  return {
    range,
    totals,
    previousTotals,
    deltas: {
      income: delta(income, prevIncome),
      expense: delta(expense, prevExpense),
      net: delta(totals.net, previousTotals.net),
    },
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : null,
    avgIncomePerDay: daysInRange > 0 ? income / daysInRange : 0,
    avgExpensePerDay: daysInRange > 0 ? expense / daysInRange : 0,
    avgExpensePerTx: expenseTxCount > 0 ? expense / expenseTxCount : 0,
    txCount,
    daysLogged: loggedDays.size,
    daysInRange,
    busiestDay,
    buckets,
    expenseByCategory: sortedSums(expenseCats),
    incomeByCategory: sortedSums(incomeCats),
    byAccount: Array.from(accountRows.values()).sort((a, b) => b.expense - a.expense),
    topExpenses: topExpenses.slice(0, TOP_EXPENSE_COUNT),
    adjustments: { in: adjIn, out: adjOut, net: adjIn - adjOut, count: adjCount },
    budgets,
    pace,
    trend,
    isEmpty: txCount === 0,
  };
}
