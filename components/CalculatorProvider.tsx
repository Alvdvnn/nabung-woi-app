import { createContext, useContext, useMemo, useRef, ReactNode } from 'react';
import Calculator, { CalculatorRef } from './Calculator';

interface CalculatorContextValue {
  open: () => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const ref = useRef<CalculatorRef>(null);
  const value = useMemo<CalculatorContextValue>(() => ({ open: () => ref.current?.open() }), []);
  return (
    <CalculatorContext.Provider value={value}>
      {children}
      <Calculator ref={ref} />
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculator must be used inside CalculatorProvider');
  return ctx;
}
