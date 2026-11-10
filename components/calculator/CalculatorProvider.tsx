import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import Calculator from './Calculator';

export interface CalculatorOpenOptions {
  /** When given, the sheet shows "Use amount" and calls back with the result. */
  onApply?: (value: number) => void;
}

interface CalculatorContextValue {
  open: (opts?: CalculatorOpenOptions) => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const applyRef = useRef<((value: number) => void) | undefined>(undefined);

  const open = useCallback((opts?: CalculatorOpenOptions) => {
    applyRef.current = opts?.onApply;
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const value = useMemo<CalculatorContextValue>(() => ({ open }), [open]);
  return (
    <CalculatorContext.Provider value={value}>
      {children}
      <Calculator
        visible={visible}
        onClose={close}
        onApply={applyRef.current ? (v) => { applyRef.current?.(v); close(); } : undefined}
      />
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculator must be used inside CalculatorProvider');
  return ctx;
}
