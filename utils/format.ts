import { getCurrentLocale } from '../i18n';

function dateLocale(): string {
  return getCurrentLocale() === 'id' ? 'id-ID' : 'en-US';
}

export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('id-ID');
  return `Rp ${formatted}`;
}

export function formatIDRCompact(amount: number): string {
  const isId = getCurrentLocale() === 'id';
  const m = isId ? 'jt' : 'M';
  const k = isId ? 'rb' : 'K';
  if (Math.abs(amount) >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}${m}`;
  if (Math.abs(amount) >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}${k}`;
  return formatIDR(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' });
}

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function groupDigits(raw: string | number): string {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!raw && raw !== 0) return '';
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('id-ID');
}
