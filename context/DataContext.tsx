import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  Account,
  Transaction,
  addTransaction as storageAddTx,
  updateTransaction as storageUpdateTx,
  deleteTransaction as storageDeleteTx,
  getAccounts as storageGetAccounts,
  getTransactions as storageGetTxs,
  insertSorted,
  saveAccounts as storageSaveAccounts,
} from '../utils/storage';
import { runMigrations } from '../utils/migrations';
import { accountBalances } from '../utils/aggregate';

interface DataContextValue {
  txs: Transaction[];
  accounts: Account[];
  hydrated: boolean;
  // Derived selectors memoized once for the entire app to share.
  txDates: Set<string>;
  /** dayKey → transactions on that day, newest first. */
  txByDay: Map<string, Transaction[]>;
  accountsById: Map<string, Account>;
  /** accountId → current balance across all time. */
  balances: Map<string, number>;
  totalBalance: number;
  // Read helpers (cache-backed).
  findTx: (id: string) => Transaction | undefined;
  // Mutations — update cache optimistically and persist.
  addTx: (tx: Transaction) => Promise<void>;
  updateTx: (tx: Transaction) => Promise<void>;
  deleteTx: (id: string) => Promise<void>;
  saveAccounts: (next: Account[]) => Promise<void>;
  // Reload from disk (after import / clear).
  refresh: () => Promise<void>;
  // Replace cache without writing to disk — for "Clear all" flow.
  resetCache: () => void;
}

const Ctx = createContext<DataContextValue | null>(null);

const byDateDesc = (a: Transaction, b: Transaction) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

export function DataProvider({ children }: { children: ReactNode }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const txsRef = useRef<Transaction[]>([]);
  const accountsRef = useRef<Account[]>([]);

  // Keep refs in sync so async handlers can roll back from the latest snapshot.
  useEffect(() => { txsRef.current = txs; }, [txs]);
  useEffect(() => { accountsRef.current = accounts; }, [accounts]);

  const refresh = useCallback(async () => {
    const [t, a] = await Promise.all([storageGetTxs(), storageGetAccounts()]);
    setTxs(t.sort(byDateDesc));
    setAccounts(a);
  }, []);

  useEffect(() => {
    // Migrations run before the first read so screens never see stale shapes.
    runMigrations()
      .then(refresh)
      .finally(() => setHydrated(true));
  }, [refresh]);

  const findTx = useCallback(
    (id: string) => txsRef.current.find((t) => t.id === id),
    []
  );

  const addTx = useCallback(async (tx: Transaction) => {
    const prev = txsRef.current;
    setTxs(insertSorted(prev, tx));
    try {
      await storageAddTx(tx);
    } catch (err) {
      setTxs(prev);
      throw err;
    }
  }, []);

  const updateTx = useCallback(async (tx: Transaction) => {
    const prev = txsRef.current;
    // The date may have moved, so re-place the row instead of patching in situ.
    setTxs(insertSorted(prev.filter((t) => t.id !== tx.id), tx));
    try {
      await storageUpdateTx(tx);
    } catch (err) {
      setTxs(prev);
      throw err;
    }
  }, []);

  const deleteTx = useCallback(async (id: string) => {
    const prev = txsRef.current;
    setTxs(prev.filter((t) => t.id !== id));
    try {
      await storageDeleteTx(id);
    } catch (err) {
      setTxs(prev);
      throw err;
    }
  }, []);

  const saveAccounts = useCallback(async (next: Account[]) => {
    const prev = accountsRef.current;
    setAccounts(next);
    try {
      await storageSaveAccounts(next);
    } catch (err) {
      setAccounts(prev);
      throw err;
    }
  }, []);

  const resetCache = useCallback(() => {
    setTxs([]);
    setAccounts([]);
  }, []);

  // One pass builds both the day index and the "has any transaction" set the
  // calendar dots read, so screens never re-scan the list to answer either.
  const { txDates, txByDay } = useMemo(() => {
    const dates = new Set<string>();
    const byDay = new Map<string, Transaction[]>();
    for (const tx of txs) {
      dates.add(tx.dayKey);
      const bucket = byDay.get(tx.dayKey);
      if (bucket) bucket.push(tx);
      else byDay.set(tx.dayKey, [tx]);
    }
    return { txDates: dates, txByDay: byDay };
  }, [txs]);

  const accountsById = useMemo(() => {
    const m = new Map<string, Account>();
    for (const a of accounts) m.set(a.id, a);
    return m;
  }, [accounts]);

  const balances = useMemo(() => accountBalances(accounts, txs), [accounts, txs]);

  const totalBalance = useMemo(() => {
    let sum = 0;
    for (const value of balances.values()) sum += value;
    return sum;
  }, [balances]);

  const value = useMemo<DataContextValue>(
    () => ({
      txs,
      accounts,
      hydrated,
      txDates,
      txByDay,
      accountsById,
      balances,
      totalBalance,
      findTx,
      addTx,
      updateTx,
      deleteTx,
      saveAccounts,
      refresh,
      resetCache,
    }),
    [
      txs, accounts, hydrated, txDates, txByDay, accountsById, balances, totalBalance,
      findTx, addTx, updateTx, deleteTx, saveAccounts, refresh, resetCache,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}

export function useTransactions(): Transaction[] {
  return useData().txs;
}

export function useAccounts(): Account[] {
  return useData().accounts;
}
