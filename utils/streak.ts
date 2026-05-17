import { Transaction } from './storage';
import { isoDay } from './format';

export interface StreakResult {
  current: number;
  longest: number;
}

export function computeStreak(txs: Transaction[], today: Date = new Date()): StreakResult {
  if (txs.length === 0) return { current: 0, longest: 0 };
  const dates = new Set(txs.map((t) => isoDay(new Date(t.date))));

  let current = 0;
  const cursor = new Date(today);
  while (dates.has(isoDay(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = Array.from(dates).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev === null) { run = 1; }
    else {
      const prevDate = new Date(prev);
      prevDate.setDate(prevDate.getDate() + 1);
      run = isoDay(prevDate) === d ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest };
}
