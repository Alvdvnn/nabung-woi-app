import {
  addDays,
  addMonths,
  endOfMonth,
  isIsoDay,
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
export type Granularity = 'day' | 'week' | 'month' | 'year' | 'custom';

/** The granularities a user can step through with prev/next. */
export type PresetGranularity = Exclude<Granularity, 'custom'>;

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

/** The range of `granularity` that contains `anchor`. `custom` falls back to the month. */
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
    case 'custom':
    default: {
      const s = startOfMonth(anchor);
      return makeRange('month', s, endOfMonth(s));
    }
  }
}

/** An arbitrary inclusive range. Swaps the ends if they arrive reversed. */
export function customRange(start: Date, end: Date): DateRange {
  const a = startOfDay(start);
  const b = startOfDay(end);
  return a <= b ? makeRange('custom', a, b) : makeRange('custom', b, a);
}

/** The last `days` days ending today (inclusive). */
export function lastDaysRange(days: number, today: Date = new Date()): DateRange {
  const end = startOfDay(today);
  return makeRange('custom', addDays(end, -(days - 1)), end);
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
    case 'custom': {
      // A custom range steps by its own length, so "previous" of 1-10 Mar is
      // 20-29 Feb: the same number of days immediately before it.
      const len = rangeLength(range);
      return customRange(addDays(range.start, len * dir), addDays(range.end, len * dir));
    }
    case 'month':
    default:
      return rangeFor('month', addMonths(start, dir));
  }
}

export function previousRange(range: DateRange): DateRange {
  return shiftRange(range, -1);
}

/** True when `range` contains today, used to disable "next period". */
export function isCurrentRange(range: DateRange, today: Date = new Date()): boolean {
  const key = isoDay(today);
  return key >= range.startKey && key <= range.endKey;
}

/** True when the range ends today or later, so stepping forward would be all future. */
export function reachesToday(range: DateRange, today: Date = new Date()): boolean {
  return range.endKey >= isoDay(today);
}

export function containsKey(range: DateRange, dayKey: string): boolean {
  return dayKey >= range.startKey && dayKey <= range.endKey;
}

export function sameRange(a: DateRange, b: DateRange): boolean {
  return a.granularity === b.granularity && a.startKey === b.startKey && a.endKey === b.endKey;
}

export interface Bucket {
  /** Prefix or exact dayKey that groups transactions into this bucket. */
  key: string;
  /** Short axis label. */
  label: string;
  /** Anchor date, for drilldown. */
  date: Date;
  /** Whether the bucket spans a whole month (year view, long custom ranges). */
  monthly: boolean;
}

// Custom ranges longer than this switch from daily to monthly buckets.
const MAX_DAILY_BUCKETS = 62;

/**
 * Chart buckets for a range:
 *   day    -> one bucket (caller renders in/out instead)
 *   week   -> 7 daily buckets
 *   month  -> one bucket per day of the month
 *   year   -> 12 monthly buckets
 *   custom -> daily up to 62 days, monthly beyond
 */
export function bucketsFor(range: DateRange, monthNames: readonly string[]): Bucket[] {
  const out: Bucket[] = [];
  const monthly =
    range.granularity === 'year' ||
    (range.granularity === 'custom' && rangeLength(range) > MAX_DAILY_BUCKETS);

  if (monthly) {
    let cursor = startOfMonth(range.start);
    while (isoDay(cursor) <= range.endKey) {
      out.push({
        key: isoDay(cursor).slice(0, 7),
        label: (monthNames[cursor.getMonth()] ?? '').slice(0, 3),
        date: cursor,
        monthly: true,
      });
      cursor = addMonths(cursor, 1);
    }
    return out;
  }
  if (range.granularity === 'day') {
    out.push({ key: range.startKey, label: String(range.start.getDate()), date: range.start, monthly: false });
    return out;
  }
  let cursor = range.start;
  while (isoDay(cursor) <= range.endKey) {
    out.push({ key: isoDay(cursor), label: String(cursor.getDate()), date: cursor, monthly: false });
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** The range a bucket drills into: the day itself, or the whole month. */
export function bucketRange(bucket: Bucket): DateRange {
  return bucket.monthly ? rangeFor('month', bucket.date) : rangeFor('day', bucket.date);
}

/** Number of days the range spans (inclusive). */
export function rangeLength(range: DateRange): number {
  return (
    Math.round(
      (parseIsoDay(range.endKey).getTime() - parseIsoDay(range.startKey).getTime()) / 86_400_000,
    ) + 1
  );
}

// ---- Route params ----------------------------------------------------------
//
// Detail screens receive the exact range the caller was looking at, so what
// they list is what the caller summed. Keys travel as plain strings.

export interface RangeParams {
  granularity: Granularity;
  start: string;
  end: string;
}

export function rangeToParams(range: DateRange): RangeParams {
  return { granularity: range.granularity, start: range.startKey, end: range.endKey };
}

const GRANULARITIES: Granularity[] = ['day', 'week', 'month', 'year', 'custom'];

export function isGranularity(x: unknown): x is Granularity {
  return typeof x === 'string' && (GRANULARITIES as string[]).includes(x);
}

/**
 * Rebuilds a DateRange from route params. Returns null when they are missing
 * or malformed so the caller can fall back to a sensible default.
 */
export function rangeFromParams(params: {
  granularity?: string | string[];
  start?: string | string[];
  end?: string | string[];
}): DateRange | null {
  const g = Array.isArray(params.granularity) ? params.granularity[0] : params.granularity;
  const s = Array.isArray(params.start) ? params.start[0] : params.start;
  const e = Array.isArray(params.end) ? params.end[0] : params.end;
  if (!isGranularity(g) || !isIsoDay(s) || !isIsoDay(e)) return null;
  if (g === 'custom') return customRange(parseIsoDay(s), parseIsoDay(e));
  // Preset ranges are re-derived from their start so week-start preference
  // and month lengths stay authoritative.
  return rangeFor(g, parseIsoDay(s));
}
