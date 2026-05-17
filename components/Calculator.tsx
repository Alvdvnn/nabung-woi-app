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

function safeEval(expr: string): number | null {
  if (!/^[0-9+\-*/.%() ]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const r = Function(`"use strict"; return (${expr.replace(/%/g, '/100')})`)();
    return Number.isFinite(r) ? r : null;
  } catch {
    return null;
  }
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
