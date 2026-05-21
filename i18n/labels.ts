import { TFn } from './index';

export function tBuiltin(t: TFn, scope: 'categories' | 'accountTypes', id: string): string {
  const v = (t as unknown as (p: string) => unknown)(`${scope}.${id}`);
  return typeof v === 'string' ? v : id;
}
