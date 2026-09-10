import {
  addDays,
  addMonths,
  isoDay,
  parseIsoDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from './date';

/**
 * A closed date range expressed in `dayKey` space (`YYYY-MM-DD`).
 *
 * Everything downstream compares transactions with plain string comparison
 * against `startKey`/`endKey`, which is both correct across DST/timezones and
 * faster than constructing Dates per transaction.
 */
export type Granularity = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  granularity: Granularity;
  /** Local midnight of the first day in range. */
  start: Date;
  /** Local midnight of the last day in range (inclusive). */
  end: Date;
  startKey: string;
  endKey: string;
}

function makeRange(granularity: Granularity, start: Date, end: Date): DateRange {
  return {
    granularity,
    start,
    end,
    startKey: isoDay(start),
    endKey: isoDay(end),
  };
}

/** The range of `granularity` that contains `anchor`. */
export function rangeFor(granularity: Granularity, anchor: Date = new Date()): DateRange {
  switch (granularity) {
    case 'day': {
      const s = startOfDay(anchor);
      return makeRange('day', s, s);
    }
    case 'week': {
      const s = startOfWeek(anchor);
      return makeRange('week', s, addDays(s, 6));
    }
    case 'year': {
      const s = startOfYear(anchor);
      return makeRange('year', s, new Date(anchor.getFullYear(), 11, 31));
    }
    case 'month':
    default: {
      const s = startOfMonth(anchor);
      const end = new Date(s.getFullYear(), s.getMonth() + 1, 0);
      return makeRange('month', s, end);
    }
  }
}

/** The adjacent range in `dir` (-1 = previous, +1 = next). */
export function shiftRange(range: DateRange, dir: 1 | -1): DateRange {
  const { granularity, start } = range;
  switch (granularity) {
    case 'day':
      return rangeFor('day', addDays(start, dir));
    case 'week':
      return rangeFor('week', addDays(start, 7 * dir));
    case 'year':
      return rangeFor('year', new Date(start.getFullYear() + dir, 0, 1));
    case 'month':
    default:
      return rangeFor('month', addMonths(start, dir));
  }
}

export function previousRange(range: DateRange): DateRange {
  return shiftRange(range, -1);
}

/** True when `range` contains today — used to disable "next period". */
export function isCurrentRange(range: DateRange, today: Date = new Date()): boolean {
  const key = isoDay(today);
  return key >= range.startKey && key <= range.endKey;
}

export function containsKey(range: DateRange, dayKey: string): boolean {
  return dayKey >= range.startKey && dayKey <= range.endKey;
}

export interface Bucket {
  /** Prefix or exact dayKey that groups transactions into this bucket. */
  key: string;
  /** Short axis label. */
  label: string;
  /** Anchor date, for drilldown. */
  date: Date;
}

/**
 * Chart buckets for a range:
 *   day   → not bucketed by time (caller renders in/out instead)
 *   week  → 7 daily buckets
 *   month → one bucket per day of the month
 *   year  → 12 monthly buckets
 */
export function bucketsFor(range: DateRange, monthNames: readonly string[]): Bucket[] {
  const out: Bucket[] = [];
  if (range.granularity === 'year') {
    for (let m = 0; m < 12; m++) {
      const d = new Date(range.start.getFullYear(), m, 1);
      out.push({ key: isoDay(d).slice(0, 7), label: (monthNames[m] ?? '').slice(0, 3), date: d });
    }
    return out;
  }
  if (range.granularity === 'day') {
    out.push({ key: range.startKey, label: String(range.start.getDate()), date: range.start });
    return out;
  }
  let cursor = range.start;
  while (isoDay(cursor) <= range.endKey) {
    out.push({ key: isoDay(cursor), label: String(cursor.getDate()), date: cursor });
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Number of days the range spans (inclusive). */
export function rangeLength(range: DateRange): number {
  return (
    Math.round(
      (parseIsoDay(range.endKey).getTime() - parseIsoDay(range.startKey).getTime()) / 86_400_000,
    ) + 1
  );
}
