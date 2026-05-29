import AsyncStorage from '@react-native-async-storage/async-storage';
import { isoDay } from './format';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
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
  type: TransactionType;
  iconId: string;
}

const KEYS = {
  transactions: 'nw.transactions',
  accounts: 'nw.accounts',
  customCategories: 'nw.customCategories',
  lastAccount: 'nw.lastAccount',
  themeMode: 'nw.themeMode',
  locale: 'nw.locale',
};

// Serialize read-modify-write ops so concurrent mutations can't clobber each other.
let txWriteChain: Promise<unknown> = Promise.resolve();
function enqueueTxWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = txWriteChain.then(fn, fn);
  txWriteChain = run.catch(() => {});
  return run;
}

export async function getTransactions(): Promise<Transaction[]> {
  const raw = await AsyncStorage.getItem(KEYS.transactions);
  if (!raw) return [];
  const list: Transaction[] = JSON.parse(raw);
  return list.map(ensureDayKey);
}

export function addTransaction(tx: Transaction): Promise<void> {
  return enqueueTxWrite(async () => {
    const list = await getTransactions();
    list.unshift(ensureDayKey(tx));
    await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(list));
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

export async function saveAccounts(accounts: Account[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(accounts));
}

export async function getCustomCategories(): Promise<CustomCategory[]> {
  const raw = await AsyncStorage.getItem(KEYS.customCategories);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCustomCategories(cats: CustomCategory[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.customCategories, JSON.stringify(cats));
}

export async function getLastAccount(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.lastAccount);
}

export async function setLastAccount(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.lastAccount, id);
}

export type StoredThemeMode = 'system' | 'light' | 'dark';

export async function getThemeMode(): Promise<StoredThemeMode> {
  const raw = await AsyncStorage.getItem(KEYS.themeMode);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export async function setThemeMode(mode: StoredThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.themeMode, mode);
}

export type StoredLocale = 'en' | 'id';

export async function getLocale(): Promise<StoredLocale> {
  const raw = await AsyncStorage.getItem(KEYS.locale);
  return raw === 'id' ? 'id' : 'en';
}

export async function setLocale(loc: StoredLocale): Promise<void> {
  await AsyncStorage.setItem(KEYS.locale, loc);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export async function exportAll(): Promise<string> {
  const [transactions, accounts, customCategories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCustomCategories(),
  ]);
  return JSON.stringify({ transactions, accounts, customCategories }, null, 2);
}

function isTransaction(x: any): x is Transaction {
  return (
    x && typeof x.id === 'string' &&
    (x.type === 'income' || x.type === 'expense') &&
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

  if (inTx.length === 0 && inAcc.length === 0 && inCat.length === 0) {
    throw new Error('invalidShape' satisfies ImportError);
  }

  const [curTx, curAcc, curCat] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCustomCategories(),
  ]);

  const mergedTx = mergeById(curTx, inTx).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const mergedAcc = mergeById(curAcc, inAcc);
  const mergedCat = mergeById(curCat, inCat);

  await Promise.all([
    AsyncStorage.setItem(KEYS.transactions, JSON.stringify(mergedTx)),
    saveAccounts(mergedAcc),
    saveCustomCategories(mergedCat),
  ]);

  return { transactions: inTx.length, accounts: inAcc.length, categories: inCat.length };
}
