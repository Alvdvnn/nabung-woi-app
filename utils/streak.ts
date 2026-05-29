import { Transaction } from './storage';
import { isoDay } from './format';

export interface StreakResult {
  current: number;
  longest: number;
}

function parseIsoDayLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function nextDayKey(iso: string): string {
  const d = parseIsoDayLocal(iso);
  d.setDate(d.getDate() + 1);
  return isoDay(d);
}

export function computeStreak(txs: Transaction[], today: Date = new Date()): StreakResult {
  if (txs.length === 0) return { current: 0, longest: 0 };

  // Build the Set once. Iterate forward so we never sort the whole list.
  const dates = new Set<string>();
  for (const t of txs) dates.add(t.dayKey);

  // Current streak: walk backwards from today, break on first miss. Cheap
  // even for years of history because it stops at the gap.
  let current = 0;
  const cursor = new Date(today);
  while (dates.has(isoDay(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak: scan each day key and count runs whose predecessor
  // isn't in the set (those are run starts). Skips the Array.from + sort
  // and is O(N) instead of O(N log N).
  let longest = 0;
  for (const day of dates) {
    const prev = parseIsoDayLocal(day);
    prev.setDate(prev.getDate() - 1);
    if (dates.has(isoDay(prev))) continue; // not a run start
    let run = 1;
    let next = nextDayKey(day);
    while (dates.has(next)) {
      run += 1;
      next = nextDayKey(next);
    }
    if (run > longest) longest = run;
  }

  return { current, longest };
}
