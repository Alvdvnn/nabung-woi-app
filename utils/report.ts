import { Account, Transaction } from './storage';
import {
  AdjustmentTotals,
  CategorySum,
  Totals,
  balanceDelta,
} from './aggregate';
import { Bucket, DateRange, bucketsFor, previousRange, rangeLength } from './period';

export interface ReportBucket extends Bucket {
  income: number;
  expense: number;
  net: number;
}

export interface AccountReport {
  accountId: string;
  name: string;
  typeId: string;
  income: number;
  expense: number;
  net: number;
  /** Balance as of now, across all time — not just the report range. */
  balance: number;
}

export interface Delta {
  /** Percent change vs the previous period, or null when there's no baseline. */
  percent: number | null;
  absolute: number;
}

export interface ReportData {
  range: DateRange;
  totals: Totals;
  previousTotals: Totals;
  deltas: { income: Delta; expense: Delta; net: Delta };
  /** Share of income kept, 0–100. Null when there was no income. */
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

/**
 * Everything the Report screen renders, computed in a single pass over the
 * transaction list.
 *
 * The naive shape of this screen is ~8 independent `filter(...)` calls over the
 * same array plus one balance pass per account. This walks the list once and
 * fills every accumulator as it goes, so cost is O(transactions + accounts)
 * regardless of how many sections the screen grows.
 */
export function buildReport(opts: {
  txs: Transaction[];
  accounts: Account[];
  range: DateRange;
  monthNames: readonly string[];
}): ReportData {
  const { txs, accounts, range, monthNames } = opts;
  const prev = previousRange(range);
  const byMonth = range.granularity === 'year';

  const buckets: ReportBucket[] = bucketsFor(range, monthNames).map((b) => ({
    ...b,
    income: 0,
    expense: 0,
    net: 0,
  }));
  const bucketIndex = new Map<string, number>();
  buckets.forEach((b, i) => bucketIndex.set(b.key, i));

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

    const bucketKey = byMonth ? key.slice(0, 7) : key;
    const bi = bucketIndex.get(bucketKey);
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
    isEmpty: txCount === 0,
  };
}
