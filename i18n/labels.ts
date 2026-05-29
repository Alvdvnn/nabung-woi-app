import { TFn } from './index';
import { Period } from '../utils/aggregate';

export function tBuiltin(t: TFn, scope: 'categories' | 'accountTypes', id: string): string {
  const v = (t as unknown as (p: string) => unknown)(`${scope}.${id}`);
  return typeof v === 'string' ? v : id;
}

// Map a Period to its typed i18n key. Replaces the `as 'period.day'` cast hack
// at every dashboard/history callsite — keep this in sync with the period.*
// branch in i18n/dicts.ts.
const PERIOD_KEYS: Record<Period, 'period.day' | 'period.month' | 'period.year'> = {
  day: 'period.day',
  month: 'period.month',
  year: 'period.year',
};

export function tPeriod(t: TFn, period: Period): string {
  return t(PERIOD_KEYS[period]);
}
