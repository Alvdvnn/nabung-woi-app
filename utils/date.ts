// Pure local-calendar date helpers. No i18n/storage deps, so anything may
// import this without creating a require cycle.

export type WeekStartDay = 'mon' | 'sun';

// Set once by PrefsProvider. Module state (not a hook) so period math in
// utils/ stays pure and synchronous.
let weekStart: WeekStartDay = 'mon';

export function setWeekStart(day: WeekStartDay): void {
  weekStart = day;
}

export function getWeekStart(): WeekStartDay {
  return weekStart;
}

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parses a `YYYY-MM-DD` key back into a local-midnight Date.
// `new Date('2026-01-05')` would parse as UTC and can land on the previous day.
export function parseIsoDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isIsoDay(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** First day of the week containing `d`, honoring the week-start preference. */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday
  if (weekStart === 'sun') return startOfDay(addDays(d, -day));
  return startOfDay(addDays(d, day === 0 ? -6 : 1 - day));
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return isoDay(a) === isoDay(b);
}

/** Keeps the wall-clock time of `from` but moves it to the calendar day `to`. */
export function moveToDay(from: Date, to: Date): Date {
  return new Date(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
    from.getHours(),
    from.getMinutes(),
    from.getSeconds(),
    from.getMilliseconds(),
  );
}
