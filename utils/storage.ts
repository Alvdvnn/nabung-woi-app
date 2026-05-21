import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  note: string;
  date: string;
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

export async function getTransactions(): Promise<Transaction[]> {
  const raw = await AsyncStorage.getItem(KEYS.transactions);
  return raw ? JSON.parse(raw) : [];
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const list = await getTransactions();
  list.unshift(tx);
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(list));
}

export async function deleteTransaction(id: string): Promise<void> {
  const list = await getTransactions();
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(list.filter((t) => t.id !== id)));
}

export async function updateTransaction(updated: Transaction): Promise<void> {
  const list = await getTransactions();
  const next = list.map((t) => (t.id === updated.id ? updated : t));
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
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

export type StoredThemeMode = 'light' | 'dark';

export async function getThemeMode(): Promise<StoredThemeMode> {
  const raw = await AsyncStorage.getItem(KEYS.themeMode);
  if (raw === 'light' || raw === 'dark') return raw;
  return 'light';
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
