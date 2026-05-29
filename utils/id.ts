// Collision-resistant id generator. Conventions used elsewhere:
//   genId('t') — transaction, genId('a') — account, genId('c') — custom category.
export function genId(prefix = ''): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}${t}${r}`;
}
