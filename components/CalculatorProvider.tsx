import { createContext, useContext, useRef, ReactNode } from 'react';
import Calculator, { CalculatorRef } from './Calculator';

interface CalculatorContextValue {
  open: () => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const ref = useRef<CalculatorRef>(null);
  return (
    <CalculatorContext.Provider value={{ open: () => ref.current?.open() }}>
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
