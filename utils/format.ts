import { getCurrentLocale, subscribeLocale } from '../i18n';
import { isoDay } from './date';

// Re-exported so existing `import { isoDay } from '../utils/format'` callers keep working.
export { isoDay };

/**
 * Formatter cache.
 *
 * `Number.prototype.toLocaleString` builds a formatter on every call, which is
 * the single hottest cost when rendering long transaction lists. Building each
 * `Intl.NumberFormat` once and reusing it turns per-row formatting into a table
 * lookup. The cache is dropped when the locale changes.
 */
let numberFmt: Intl.NumberFormat | null = null;
let dateFmt: Intl.DateTimeFormat | null = null;
let dayMonthFmt: Intl.DateTimeFormat | null = null;

subscribeLocale(() => {
  numberFmt = null;
  dateFmt = null;
  dayMonthFmt = null;
});

function dateLocale(): string {
  return getCurrentLocale() === 'id' ? 'id-ID' : 'en-US';
}

function numbers(): Intl.NumberFormat {
  // Amounts always render with Indonesian digit grouping — the app is IDR-only,
  // so grouping style stays stable even when UI language is English.
  if (!numberFmt) numberFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  return numberFmt;
}

export function formatIDR(amount: number): string {
  return `Rp ${numbers().format(Math.round(amount))}`;
}

/** Signed variant: always shows + or −, for deltas and net figures. */
export function formatIDRSigned(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return `${sign}Rp ${numbers().format(Math.abs(rounded))}`;
}

export function formatIDRCompact(amount: number): string {
  const isId = getCurrentLocale() === 'id';
  const m = isId ? 'jt' : 'M';
  const k = isId ? 'rb' : 'K';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}${isId ? 'M' : 'B'}`;
  if (abs >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}${m}`;
  if (abs >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}${k}`;
  return formatIDR(amount);
}

export function formatDate(iso: string): string {
  if (!dateFmt) {
    dateFmt = new Intl.DateTimeFormat(dateLocale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return dateFmt.format(new Date(iso));
}

export function formatDayMonth(iso: string): string {
  if (!dayMonthFmt) {
    dayMonthFmt = new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short' });
  }
  return dayMonthFmt.format(new Date(iso));
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function groupDigits(raw: string | number): string {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!raw && raw !== 0) return '';
  if (!Number.isFinite(n)) return '';
  return numbers().format(n);
}
