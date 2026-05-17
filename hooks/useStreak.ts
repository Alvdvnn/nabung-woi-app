import { useMemo } from 'react';
import { computeStreak, StreakResult } from '../utils/streak';
import { Transaction } from '../utils/storage';

export function useStreak(txs: Transaction[]): StreakResult {
  return useMemo(() => computeStreak(txs), [txs]);
}
