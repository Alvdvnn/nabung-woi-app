/**
 * Phone-style calculator engine. Pure and synchronous; the UI only renders
 * `CalcState` and dispatches keys. No `eval`: expressions are tokenised and
 * reduced with a precedence-aware shunting-yard pass.
 */

export type Op = '+' | '-' | '*' | '/';
export type CalcKey = Op | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '=' | '%' | 'neg' | 'back' | 'clear';

/** A completed token: a number or an operator. Numbers are stored as strings so "1.50" keeps its typed form. */
export type Token = { kind: 'num'; text: string } | { kind: 'op'; op: Op };

export interface CalcState {
  /** Completed tokens: number op number op ... */
  tokens: Token[];
  /** The number being typed; '' when none. */
  current: string;
  /** Shown only after '='. */
  result: number | null;
  /** True right after '=' so the next digit starts fresh and '=' repeats. */
  evaluated: boolean;
  /** Last operation applied, so repeated '=' re-applies it. */
  repeat: { op: Op; operand: number } | null;
  error: boolean;
}

export const INITIAL_CALC: CalcState = {
  tokens: [],
  current: '',
  result: null,
  evaluated: false,
  repeat: null,
  error: false,
};

const PREC: Record<Op, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

function apply(op: Op, a: number, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? NaN : a / b;
  }
}

/** Evaluates a complete token list (must start and end with a number). */
export function evaluateTokens(tokens: Token[]): number | null {
  if (tokens.length === 0) return null;
  const output: Token[] = [];
  const ops: Op[] = [];
  let expectNum = true;
  for (const tk of tokens) {
    if (tk.kind === 'num') {
      if (!expectNum) return null;
      output.push(tk);
      expectNum = false;
    } else {
      if (expectNum) return null;
      while (ops.length && PREC[ops[ops.length - 1]] >= PREC[tk.op]) output.push({ kind: 'op', op: ops.pop()! });
      ops.push(tk.op);
      expectNum = true;
    }
  }
  if (expectNum) return null;
  while (ops.length) output.push({ kind: 'op', op: ops.pop()! });

  const stack: number[] = [];
  for (const tk of output) {
    if (tk.kind === 'num') {
      const n = Number(tk.text);
      if (!Number.isFinite(n)) return null;
      stack.push(n);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return null;
      stack.push(apply(tk.op, a, b));
    }
  }
  if (stack.length !== 1) return null;
  const r = stack[0];
  return Number.isFinite(r) ? roundFloat(r) : null;
}

/** Trims binary float noise (0.1 + 0.2) without losing real precision. */
export function roundFloat(n: number): number {
  return Math.round(n * 1e10) / 1e10;
}

function numText(n: number): string {
  return String(roundFloat(n));
}

/** Tokens plus the number being typed, if the combination is a valid expression. */
function pending(state: CalcState): Token[] | null {
  const tokens = state.current ? [...state.tokens, { kind: 'num' as const, text: state.current }] : state.tokens;
  const last = tokens[tokens.length - 1];
  if (!last || last.kind !== 'num') return null;
  return tokens;
}

/** Live preview of what '=' would produce, or null while the expression is incomplete. */
export function preview(state: CalcState): number | null {
  if (state.evaluated) return state.result;
  const tokens = pending(state);
  if (!tokens || tokens.length < 3) return null;
  return evaluateTokens(tokens);
}

export function reduce(state: CalcState, key: CalcKey): CalcState {
  if (key === 'clear') return INITIAL_CALC;

  // Any key after an error starts over (except clear, handled above).
  const s = state.error ? INITIAL_CALC : state;

  if (key >= '0' && key <= '9') {
    const base = s.evaluated ? INITIAL_CALC : s;
    const cur = base.current === '0' ? '' : base.current;
    return { ...base, current: cur + key, evaluated: false, result: null };
  }

  if (key === '.') {
    const base = s.evaluated ? INITIAL_CALC : s;
    if (base.current.includes('.')) return base;
    return { ...base, current: (base.current || '0') + '.', evaluated: false, result: null };
  }

  if (key === 'back') {
    if (s.evaluated) return INITIAL_CALC;
    if (s.current) return { ...s, current: s.current.slice(0, -1) };
    // Nothing typed: drop a dangling operator so the user can pick another.
    const last = s.tokens[s.tokens.length - 1];
    if (last?.kind === 'op') return { ...s, tokens: s.tokens.slice(0, -1) };
    return s;
  }

  if (key === 'neg') {
    if (s.evaluated && s.result !== null) {
      return { ...INITIAL_CALC, current: numText(-s.result) };
    }
    if (!s.current || s.current === '0') return s;
    return { ...s, current: s.current.startsWith('-') ? s.current.slice(1) : '-' + s.current };
  }

  if (key === '%') {
    // Phone semantics: "200 + 10%" means 200 + 20; "200 x 10%" means 200 x 0.1.
    const curText = s.evaluated && s.result !== null ? numText(s.result) : s.current;
    if (!curText) return s;
    const cur = Number(curText);
    const base = s.evaluated ? { ...INITIAL_CALC } : s;
    const lastOp = base.tokens[base.tokens.length - 1];
    const prevNum = base.tokens[base.tokens.length - 2];
    let value = cur / 100;
    if (lastOp?.kind === 'op' && prevNum?.kind === 'num' && (lastOp.op === '+' || lastOp.op === '-')) {
      value = (Number(prevNum.text) * cur) / 100;
    }
    return { ...base, current: numText(value), evaluated: false, result: null };
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    // After '=', the result becomes the left operand.
    if (s.evaluated && s.result !== null) {
      return { ...INITIAL_CALC, tokens: [{ kind: 'num', text: numText(s.result) }, { kind: 'op', op: key }] };
    }
    if (s.current) {
      return { ...s, tokens: [...s.tokens, { kind: 'num', text: s.current }, { kind: 'op', op: key }], current: '' };
    }
    const last = s.tokens[s.tokens.length - 1];
    if (last?.kind === 'op') {
      // Chained operators: the newest one wins.
      return { ...s, tokens: [...s.tokens.slice(0, -1), { kind: 'op', op: key }] };
    }
    if (!last) {
      // Operator first: start from 0 like a phone does.
      return { ...s, tokens: [{ kind: 'num', text: '0' }, { kind: 'op', op: key }] };
    }
    return s;
  }

  if (key === '=') {
    if (s.evaluated && s.result !== null && s.repeat) {
      const r = apply(s.repeat.op, s.result, s.repeat.operand);
      if (!Number.isFinite(r)) return { ...s, error: true };
      return { ...s, result: roundFloat(r) };
    }
    const tokens = pending(s);
    if (!tokens || tokens.length === 0) return s;
    const r = evaluateTokens(tokens);
    if (r === null) return { ...s, error: true, evaluated: true, result: null };
    const lastOpTok = tokens[tokens.length - 2];
    const lastNum = tokens[tokens.length - 1];
    const repeat =
      lastOpTok?.kind === 'op' && lastNum.kind === 'num' ? { op: lastOpTok.op, operand: Number(lastNum.text) } : null;
    return { tokens, current: '', result: r, evaluated: true, repeat, error: false };
  }

  return s;
}

/** Human form of the typed expression, e.g. "12.000 + 5.000 x 2". */
export function expressionText(state: CalcState, fmt: (n: string) => string): string {
  const parts = state.tokens.map((tk) => (tk.kind === 'num' ? fmt(tk.text) : OP_LABEL[tk.op]));
  if (state.current) parts.push(fmt(state.current));
  return parts.join(' ');
}

export const OP_LABEL: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
