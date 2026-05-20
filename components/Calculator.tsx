import { forwardRef, useMemo, useState, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize } from '../constants/theme';

type Kind = 'num' | 'op' | 'action';
interface Key { label: string; kind: Kind; value: string; flex?: number }

const ROWS: Key[][] = [
  [
    { label: 'C', kind: 'action', value: 'C' },
    { label: '⌫', kind: 'action', value: 'BACK' },
    { label: '%', kind: 'op', value: '%' },
    { label: '÷', kind: 'op', value: '/' },
  ],
  [
    { label: '7', kind: 'num', value: '7' },
    { label: '8', kind: 'num', value: '8' },
    { label: '9', kind: 'num', value: '9' },
    { label: '×', kind: 'op', value: '*' },
  ],
  [
    { label: '4', kind: 'num', value: '4' },
    { label: '5', kind: 'num', value: '5' },
    { label: '6', kind: 'num', value: '6' },
    { label: '−', kind: 'op', value: '-' },
  ],
  [
    { label: '1', kind: 'num', value: '1' },
    { label: '2', kind: 'num', value: '2' },
    { label: '3', kind: 'num', value: '3' },
    { label: '+', kind: 'op', value: '+' },
  ],
  [
    { label: '0', kind: 'num', value: '0', flex: 2 },
    { label: '.', kind: 'num', value: '.' },
    { label: '=', kind: 'action', value: '=' },
  ],
];

type Token = { kind: 'num'; value: number } | { kind: 'op'; value: string };

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ') { i++; continue; }
    if (c >= '0' && c <= '9' || c === '.') {
      let j = i;
      while (j < expr.length && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] === '.')) j++;
      const numStr = expr.slice(i, j);
      // Handle trailing % (percent of preceding number)
      if (expr[j] === '%') {
        const n = Number(numStr);
        if (!Number.isFinite(n)) return null;
        tokens.push({ kind: 'num', value: n / 100 });
        i = j + 1;
      } else {
        const n = Number(numStr);
        if (!Number.isFinite(n)) return null;
        tokens.push({ kind: 'num', value: n });
        i = j;
      }
      continue;
    }
    if (c === '+' || c === '*' || c === '/') {
      tokens.push({ kind: 'op', value: c });
      i++;
      continue;
    }
    if (c === '-') {
      // Unary if first token or follows an operator
      const prev = tokens[tokens.length - 1];
      if (!prev || prev.kind === 'op') {
        // Read following number as negative
        let j = i + 1;
        while (j < expr.length && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] === '.')) j++;
        if (j === i + 1) return null;
        const numStr = expr.slice(i + 1, j);
        const n = Number(numStr);
        if (!Number.isFinite(n)) return null;
        if (expr[j] === '%') {
          tokens.push({ kind: 'num', value: -n / 100 });
          i = j + 1;
        } else {
          tokens.push({ kind: 'num', value: -n });
          i = j;
        }
        continue;
      }
      tokens.push({ kind: 'op', value: '-' });
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

function safeEval(expr: string): number | null {
  if (!expr) return null;
  const tokens = tokenize(expr);
  if (!tokens || tokens.length === 0) return null;

  // Shunting-yard to RPN
  const output: Token[] = [];
  const ops: Token[] = [];
  for (const t of tokens) {
    if (t.kind === 'num') {
      output.push(t);
    } else {
      while (
        ops.length > 0 &&
        ops[ops.length - 1].kind === 'op' &&
        PREC[(ops[ops.length - 1] as { value: string }).value] >= PREC[t.value]
      ) {
        output.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length > 0) output.push(ops.pop()!);

  // Evaluate RPN
  const stack: number[] = [];
  for (const t of output) {
    if (t.kind === 'num') {
      stack.push(t.value);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return null;
      let r: number;
      switch (t.value) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': r = b === 0 ? NaN : a / b; break;
        default: return null;
      }
      stack.push(r);
    }
  }
  if (stack.length !== 1) return null;
  const result = stack[0];
  return Number.isFinite(result) ? result : null;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('id-ID');
  const [intPart, decPart] = n.toString().split('.');
  return Number(intPart).toLocaleString('id-ID') + ',' + decPart;
}

function formatExpr(expr: string): string {
  if (!expr) return ' ';
  // Replace operator chars w/ display chars, format each numeric chunk w/ thousand sep.
  return expr
    .replace(/(\d+(?:\.\d+)?)/g, (m) => {
      const [i, d] = m.split('.');
      return Number(i).toLocaleString('id-ID') + (d !== undefined ? ',' + d : '');
    })
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/-/g, ' − ')
    .replace(/\+/g, ' + ');
}

export interface CalculatorRef {
  open: () => void;
}

export default forwardRef<CalculatorRef>(function Calculator(_, ref) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');

  useImperativeHandle(ref, () => ({ open: () => sheetRef.current?.present() }), []);

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: spacing.lg, gap: spacing.md },
    handle: { backgroundColor: colors.borderStrong },
    bg: { backgroundColor: colors.card },
    display: {
      backgroundColor: colors.bg,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 6,
      minHeight: 110,
    },
    expr: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '500' },
    result: { fontSize: fontSize.display, fontWeight: '800', color: colors.textPrimary },
    grid: { gap: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.sm },
    key: {
      flex: 1,
      height: 60,
      borderRadius: radius.md,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyOp: { backgroundColor: colors.primarySoft },
    keyAction: { backgroundColor: colors.primary },
    keyLabel: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
    keyLabelOp: { color: colors.primary },
    keyLabelAction: { color: colors.white },
  }), [colors]);

  function press(k: Key) {
    if (k.value === 'C') { setExpr(''); setResult(''); return; }
    if (k.value === 'BACK') {
      setExpr((e) => {
        const next = e.slice(0, -1);
        const r = safeEval(next);
        setResult(r === null ? '' : formatNum(r));
        return next;
      });
      return;
    }
    if (k.value === '=') {
      const r = safeEval(expr);
      setResult(r === null ? 'Error' : formatNum(r));
      return;
    }
    setExpr((e) => {
      const next = e + k.value;
      const r = safeEval(next);
      if (r !== null) setResult(formatNum(r));
      return next;
    });
  }

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );

  const snapPoints = useMemo(() => ['70%'], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      index={0}
      handleStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.bg}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.display}>
          <Text style={styles.expr} numberOfLines={1}>{formatExpr(expr)}</Text>
          <Text style={styles.result} numberOfLines={1}>{result || '0'}</Text>
        </View>
        <View style={styles.grid}>
          {ROWS.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((k) => (
                <Pressable
                  key={k.label}
                  style={[
                    styles.key,
                    { flex: k.flex ?? 1 },
                    k.kind === 'op' && styles.keyOp,
                    k.kind === 'action' && styles.keyAction,
                  ]}
                  onPress={() => press(k)}
                >
                  <Text style={[
                    styles.keyLabel,
                    k.kind === 'op' && styles.keyLabelOp,
                    k.kind === 'action' && styles.keyLabelAction,
                  ]}>{k.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
