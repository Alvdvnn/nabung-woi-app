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
import { AppState, AppStateStatus } from 'react-native';
import { hasPin } from '../utils/pin';

const BG_LOCK_AFTER_MS = 60_000;

interface PinContextValue {
  hydrated: boolean;
  enabled: boolean;
  locked: boolean;
  refresh: () => Promise<void>;
  unlock: () => void;
  forceLock: () => void;
}

const PinContext = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const lastBackgroundedAt = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const on = await hasPin();
    setEnabled(on);
    if (!on) setLocked(false);
  }, []);

  useEffect(() => {
    (async () => {
      const on = await hasPin();
      setEnabled(on);
      setLocked(on);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        lastBackgroundedAt.current = Date.now();
      } else if (next === 'active') {
        if (!enabled) return;
        const at = lastBackgroundedAt.current;
        if (at !== null && Date.now() - at >= BG_LOCK_AFTER_MS) {
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const unlock = useCallback(() => {
    lastBackgroundedAt.current = null;
    setLocked(false);
  }, []);

  const forceLock = useCallback(() => {
    setLocked(true);
  }, []);

  const value = useMemo<PinContextValue>(
    () => ({ hydrated, enabled, locked, refresh, unlock, forceLock }),
    [hydrated, enabled, locked, refresh, unlock, forceLock],
  );

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
}

export function usePin(): PinContextValue {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePin must be used inside PinProvider');
  return ctx;
}
