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
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const show = useCallback((variant: ToastVariant, message: string, opts?: { duration?: number }) => {
    idRef.current += 1;
    setToast({ id: idRef.current, variant, message, duration: opts?.duration ?? 2500 });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);
  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          variant={toast.variant}
          message={toast.message}
          duration={toast.duration}
          onDismiss={dismiss}
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
