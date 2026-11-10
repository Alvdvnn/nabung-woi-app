import AsyncStorage from '@react-native-async-storage/async-storage';
import { isoDay } from './date';
import { DEFAULT_PALETTE, PaletteId, isPaletteId } from '../constants/theme';

export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
// Custom categories only apply to income/expense — transfers and adjustments
// have no category (they use the reserved ids 'transfer' / 'adjustment').
export type CategoryKind = 'income' | 'expense';

/** Which way an adjustment moves the account balance. */
export type AdjustmentDirection = 'in' | 'out';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  /**
   * Adjustment rows only. `amount` stays positive for every transaction type;
   * this is what decides whether the balance goes up or down. Reading code must
   * treat a missing direction on an adjustment as 'out' (the common case).
   */
  direction?: AdjustmentDirection;
  note: string;
  date: string;
  // Local calendar day key (YYYY-MM-DD) derived from `date` at write time.
  // Stable across timezone/DST changes — use this for day/month/year filtering.
  dayKey: string;
}

function ensureDayKey(tx: Transaction): Transaction {
  if (tx.dayKey) return tx;
  return { ...tx, dayKey: isoDay(new Date(tx.date)) };
}

export interface Account {
  id: string;
  name: string;
  typeId: string;
  startingBalance: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: CategoryKind;
  iconId: string;
}

/** Monthly spending cap for one expense category. One amount applies to every month. */
export interface Budget {
  categoryId: string;
  monthly: number;
}

const KEYS = {
  transactions: 'nw.transactions',
  accounts: 'nw.accounts',
  customCategories: 'nw.customCategories',
  lastAccount: 'nw.lastAccount',
  themeMode: 'nw.themeMode',
  locale: 'nw.locale',
  historyPrefs: 'nw.historyPrefs',
  balanceHidden: 'nw.balanceHidden',
  theme: 'nw.theme',
  prefs: 'nw.prefs',
  budgets: 'nw.budgets',
  calcHistory: 'nw.calcHistory',
  whatsNewSeen: 'nw.whatsNewSeen',
};

// Keys that hold user data. "Clear all data" removes exactly these; UI
// preferences (theme, language, prefs) survive a wipe.
const DATA_KEYS = [
  KEYS.transactions,
  KEYS.accounts,
  KEYS.customCategories,
  KEYS.lastAccount,
  KEYS.budgets,
  KEYS.historyPrefs,
];

// Serialize read-modify-write ops so concurrent mutations can't clobber each other.
let txWriteChain: Promise<unknown> = Promise.resolve();
function enqueueTxWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = txWriteChain.then(fn, fn);
  txWriteChain = run.catch(() => {});
  return run;
}

let accountWriteChain: Promise<unknown> = Promise.resolve();
function enqueueAccountWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = accountWriteChain.then(fn, fn);
  accountWriteChain = run.catch(() => {});
  return run;
}

let categoryWriteChain: Promise<unknown> = Promise.resolve();
function enqueueCategoryWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = categoryWriteChain.then(fn, fn);
  categoryWriteChain = run.catch(() => {});
  return run;
}

export async function getTransactions(): Promise<Transaction[]> {
  const raw = await AsyncStorage.getItem(KEYS.transactions);
  if (!raw) return [];
  const list: Transaction[] = JSON.parse(raw);
  return list.map(ensureDayKey);
}

// The list is kept newest-first. Inserting at the right index (instead of
// always prepending) keeps a back-dated entry in its chronological place, so
// screens can render the stored order directly without re-sorting.
export function insertSorted(list: Transaction[], tx: Transaction): Transaction[] {
  const at = new Date(tx.date).getTime();
  let i = 0;
  while (i < list.length && new Date(list[i].date).getTime() >= at) i += 1;
  const next = list.slice();
  next.splice(i, 0, tx);
  return next;
}

export function addTransaction(tx: Transaction): Promise<void> {
  return enqueueTxWrite(async () => {
    const list = await getTransactions();
    const next = insertSorted(list, ensureDayKey(tx));
    await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
  });
}

export function deleteTransaction(id: string): Promise<void> {
  return enqueueTxWrite(async () => {
    const list = await getTransactions();
    await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(list.filter((t) => t.id !== id)));
  });
}

export function updateTransaction(updated: Transaction): Promise<void> {
  return enqueueTxWrite(async () => {
    const list = await getTransactions();
    const next = ensureDayKey(updated);
    await AsyncStorage.setItem(
      KEYS.transactions,
      JSON.stringify(list.map((t) => (t.id === next.id ? next : t))),
    );
  });
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  const list = await getTransactions();
  return list.find((t) => t.id === id);
}

export async function getAccounts(): Promise<Account[]> {
  const raw = await AsyncStorage.getItem(KEYS.accounts);
  return raw ? JSON.parse(raw) : [];
}

export function saveAccounts(accounts: Account[]): Promise<void> {
  return enqueueAccountWrite(async () => {
    await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(accounts));
  });
}

export async function getCustomCategories(): Promise<CustomCategory[]> {
  const raw = await AsyncStorage.getItem(KEYS.customCategories);
  return raw ? JSON.parse(raw) : [];
}

export function saveCustomCategories(cats: CustomCategory[]): Promise<void> {
  return enqueueCategoryWrite(async () => {
    await AsyncStorage.setItem(KEYS.customCategories, JSON.stringify(cats));
  });
}

export async function getLastAccount(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.lastAccount);
}

export async function setLastAccount(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.lastAccount, id);
}

export type StoredThemeMode = 'system' | 'light' | 'dark';

export interface StoredTheme {
  palette: PaletteId;
  mode: StoredThemeMode;
}

function isThemeMode(x: unknown): x is StoredThemeMode {
  return x === 'light' || x === 'dark' || x === 'system';
}

/**
 * v2 stores `{ palette, mode }` under `nw.theme`. v1 stored only the mode under
 * `nw.themeMode`; it is read as a fallback so an upgrade keeps the user's choice.
 */
export async function getTheme(): Promise<StoredTheme> {
  const raw = await AsyncStorage.getItem(KEYS.theme);
  if (raw) {
    try {
      const p = JSON.parse(raw);
      return {
        palette: isPaletteId(p?.palette) ? p.palette : DEFAULT_PALETTE,
        mode: isThemeMode(p?.mode) ? p.mode : 'system',
      };
    } catch {
      // fall through to legacy
    }
  }
  const legacy = await AsyncStorage.getItem(KEYS.themeMode);
  return { palette: DEFAULT_PALETTE, mode: isThemeMode(legacy) ? legacy : 'system' };
}

export async function setTheme(theme: StoredTheme): Promise<void> {
  await AsyncStorage.setItem(KEYS.theme, JSON.stringify(theme));
}

// ---- Preferences -----------------------------------------------------------

export type WeekStart = 'mon' | 'sun';
/** Seconds in background before the PIN re-locks. 0 = immediately, -1 = never. */
export type AutoLockSec = 0 | 30 | 60 | 300 | -1;

export interface Prefs {
  defaultAccountId?: string;
  weekStart: WeekStart;
  haptics: boolean;
  autoLockSec: AutoLockSec;
  /** ISO timestamp of the last export, for the backup reminder. */
  lastExportAt?: string;
  /** ISO timestamp until which the dashboard backup nudge stays hidden. */
  backupNudgeSnoozedUntil?: string;
}

export const DEFAULT_PREFS: Prefs = {
  weekStart: 'mon',
  haptics: true,
  autoLockSec: 60,
};

const AUTO_LOCK_VALUES: AutoLockSec[] = [0, 30, 60, 300, -1];

export async function getPrefs(): Promise<Prefs> {
  const raw = await AsyncStorage.getItem(KEYS.prefs);
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const p = JSON.parse(raw) ?? {};
    return {
      defaultAccountId: typeof p.defaultAccountId === 'string' ? p.defaultAccountId : undefined,
      weekStart: p.weekStart === 'sun' ? 'sun' : 'mon',
      haptics: p.haptics !== false,
      autoLockSec: AUTO_LOCK_VALUES.includes(p.autoLockSec) ? p.autoLockSec : DEFAULT_PREFS.autoLockSec,
      lastExportAt: typeof p.lastExportAt === 'string' ? p.lastExportAt : undefined,
      backupNudgeSnoozedUntil:
        typeof p.backupNudgeSnoozedUntil === 'string' ? p.backupNudgeSnoozedUntil : undefined,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function setPrefs(prefs: Prefs): Promise<void> {
  await AsyncStorage.setItem(KEYS.prefs, JSON.stringify(prefs));
}

// ---- Budgets ---------------------------------------------------------------

let budgetWriteChain: Promise<unknown> = Promise.resolve();
function enqueueBudgetWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = budgetWriteChain.then(fn, fn);
  budgetWriteChain = run.catch(() => {});
  return run;
}

function isBudget(x: any): x is Budget {
  return x && typeof x.categoryId === 'string' && typeof x.monthly === 'number' && x.monthly >= 0;
}

export async function getBudgets(): Promise<Budget[]> {
  const raw = await AsyncStorage.getItem(KEYS.budgets);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isBudget) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: Budget[]): Promise<void> {
  return enqueueBudgetWrite(async () => {
    await AsyncStorage.setItem(KEYS.budgets, JSON.stringify(budgets));
  });
}

// ---- Calculator history ----------------------------------------------------

export interface CalcHistoryEntry {
  expr: string;
  result: number;
  at: string;
}

export const CALC_HISTORY_MAX = 50;

export async function getCalcHistory(): Promise<CalcHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.calcHistory);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list)
      ? list.filter((e) => e && typeof e.expr === 'string' && typeof e.result === 'number')
      : [];
  } catch {
    return [];
  }
}

export async function setCalcHistory(list: CalcHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.calcHistory, JSON.stringify(list.slice(0, CALC_HISTORY_MAX)));
}

// ---- What's new ------------------------------------------------------------

export async function getWhatsNewSeen(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.whatsNewSeen);
}

export async function setWhatsNewSeen(version: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.whatsNewSeen, version);
}

export type HistoryFilter = 'all' | TransactionType;
export type HistoryPeriod = 'day' | 'week' | 'month' | 'year';
export interface HistoryPrefs {
  filter: HistoryFilter;
  period: HistoryPeriod;
  // v2 additions. All optional so a v1 blob still parses.
  accountId?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export async function getHistoryPrefs(): Promise<HistoryPrefs | null> {
  const raw = await AsyncStorage.getItem(KEYS.historyPrefs);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    const filter: HistoryFilter =
      p.filter === 'income' ||
      p.filter === 'expense' ||
      p.filter === 'transfer' ||
      p.filter === 'adjustment'
        ? p.filter
        : 'all';
    const period: HistoryPeriod =
      p.period === 'day' || p.period === 'week' || p.period === 'year' ? p.period : 'month';
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
    return {
      filter,
      period,
      accountId: typeof p.accountId === 'string' ? p.accountId : undefined,
      categoryId: typeof p.categoryId === 'string' ? p.categoryId : undefined,
      minAmount: num(p.minAmount),
      maxAmount: num(p.maxAmount),
    };
  } catch {
    return null;
  }
}

export async function setHistoryPrefs(prefs: HistoryPrefs): Promise<void> {
  await AsyncStorage.setItem(KEYS.historyPrefs, JSON.stringify(prefs));
}

export async function getBalanceHidden(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.balanceHidden)) === '1';
}

export async function setBalanceHidden(hidden: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.balanceHidden, hidden ? '1' : '0');
}

export type StoredLocale = 'en' | 'id';

export async function getLocale(): Promise<StoredLocale> {
  const raw = await AsyncStorage.getItem(KEYS.locale);
  return raw === 'id' ? 'id' : 'en';
}

export async function setLocale(loc: StoredLocale): Promise<void> {
  await AsyncStorage.setItem(KEYS.locale, loc);
}

/** Removes user data only. Theme, language, and preferences are kept. */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(DATA_KEYS);
}

export const EXPORT_FORMAT_VERSION = 2;

/**
 * Backup payload. v1 files had only transactions/accounts/customCategories;
 * `budgets` and `format` are additive so old files still import.
 */
export async function exportAll(): Promise<string> {
  const [transactions, accounts, customCategories, budgets] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCustomCategories(),
    getBudgets(),
  ]);
  return JSON.stringify(
    {
      app: 'nabung-woi',
      format: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      transactions,
      accounts,
      customCategories,
      budgets,
    },
    null,
    2,
  );
}

function isTransaction(x: any): x is Transaction {
  return (
    x && typeof x.id === 'string' &&
    (x.type === 'income' || x.type === 'expense' || x.type === 'transfer' || x.type === 'adjustment') &&
    typeof x.amount === 'number' &&
    typeof x.categoryId === 'string' &&
    typeof x.accountId === 'string' &&
    typeof x.note === 'string' &&
    typeof x.date === 'string'
    // dayKey is optional in import payloads; backfilled by ensureDayKey.
  );
}

function isAccount(x: any): x is Account {
  return (
    x && typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.typeId === 'string' &&
    typeof x.startingBalance === 'number'
  );
}

function isCustomCategory(x: any): x is CustomCategory {
  return (
    x && typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    (x.type === 'income' || x.type === 'expense') &&
    typeof x.iconId === 'string'
  );
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of current) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

export type ImportError = 'invalidJson' | 'invalidShape';

export interface ImportSummary {
  transactions: number;
  accounts: number;
  categories: number;
  budgets: number;
  orphanTransactions: number;
}

// Merges imported data into existing by id (imported wins on conflict). Never deletes current data.
export async function importAll(json: string): Promise<ImportSummary> {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('invalidJson' satisfies ImportError);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('invalidShape' satisfies ImportError);
  }

  const inTx: Transaction[] = Array.isArray(parsed.transactions)
    ? parsed.transactions.filter(isTransaction).map(ensureDayKey)
    : [];
  const inAcc: Account[] = Array.isArray(parsed.accounts)
    ? parsed.accounts.filter(isAccount)
    : [];
  const inCat: CustomCategory[] = Array.isArray(parsed.customCategories)
    ? parsed.customCategories.filter(isCustomCategory)
    : [];
  const inBudgets: Budget[] = Array.isArray(parsed.budgets) ? parsed.budgets.filter(isBudget) : [];

  if (inTx.length === 0 && inAcc.length === 0 && inCat.length === 0 && inBudgets.length === 0) {
    throw new Error('invalidShape' satisfies ImportError);
  }

  // Accounts, categories, and budgets first so the transaction merge can
  // validate against the final account set. Each goes through its own chain.
  const [curAcc, curCat, curBudgets] = await Promise.all([
    getAccounts(),
    getCustomCategories(),
    getBudgets(),
  ]);
  const mergedAcc = mergeById(curAcc, inAcc);
  const mergedCat = mergeById(curCat, inCat);
  const budgetMap = new Map(curBudgets.map((b) => [b.categoryId, b] as const));
  for (const b of inBudgets) budgetMap.set(b.categoryId, b);
  const mergedBudgets = Array.from(budgetMap.values());

  await Promise.all([saveAccounts(mergedAcc), saveCustomCategories(mergedCat), saveBudgets(mergedBudgets)]);

  // Drop incoming transactions that point at an unknown account so import
  // doesn't permanently create orphan rows the UI has to special-case.
  const knownAccountIds = new Set(mergedAcc.map((a) => a.id));
  const acceptedInTx = inTx.filter((t) => knownAccountIds.has(t.accountId));
  const orphanTx = inTx.length - acceptedInTx.length;

  // The transaction merge is a read-modify-write, so it runs inside the same
  // chain as addTransaction/updateTransaction and cannot race them.
  await enqueueTxWrite(async () => {
    const curTx = await getTransactions();
    const mergedTx = mergeById(curTx, acceptedInTx).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(mergedTx));
  });

  return {
    transactions: acceptedInTx.length,
    accounts: inAcc.length,
    categories: inCat.length,
    budgets: inBudgets.length,
    orphanTransactions: orphanTx,
  };
}
