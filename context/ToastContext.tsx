import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import Toast, { ToastVariant } from '../components/Toast';

interface ToastState {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
}

interface ToastContextValue {
  show: (variant: ToastVariant, message: string, opts?: { duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastState[]>([]);
  const idRef = useRef(0);

  const show = useCallback((variant: ToastVariant, message: string, opts?: { duration?: number }) => {
    idRef.current += 1;
    const next: ToastState = { id: idRef.current, variant, message, duration: opts?.duration ?? 2500 };
    setQueue((q) => [...q, next]);
  }, []);

  const dismissHead = useCallback((id: number) => {
    setQueue((q) => (q.length > 0 && q[0].id === id ? q.slice(1) : q));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);
  const head = queue[0];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {head && (
        <Toast
          key={head.id}
          variant={head.variant}
          message={head.message}
          duration={head.duration}
          onDismiss={() => dismissHead(head.id)}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
