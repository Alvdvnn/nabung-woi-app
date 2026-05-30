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
  saveAccounts as storageSaveAccounts,
} from '../utils/storage';
import { runMigrations } from '../utils/migrations';

interface DataContextValue {
  txs: Transaction[];
  accounts: Account[];
  hydrated: boolean;
  // Derived selectors memoized once for the entire app to share.
  txDates: Set<string>;
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
    setTxs(t.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()));
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
    setTxs([tx, ...prev]);
    try {
      await storageAddTx(tx);
    } catch (err) {
      setTxs(prev);
      throw err;
    }
  }, []);

  const updateTx = useCallback(async (tx: Transaction) => {
    const prev = txsRef.current;
    setTxs(prev.map((t) => (t.id === tx.id ? tx : t)));
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

  const txDates = useMemo(() => {
    const s = new Set<string>();
    for (const tx of txs) s.add(tx.dayKey);
    return s;
  }, [txs]);

  const value = useMemo<DataContextValue>(
    () => ({ txs, accounts, hydrated, txDates, findTx, addTx, updateTx, deleteTx, saveAccounts, refresh, resetCache }),
    [txs, accounts, hydrated, txDates, findTx, addTx, updateTx, deleteTx, saveAccounts, refresh, resetCache]
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
