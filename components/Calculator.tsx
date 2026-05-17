import { forwardRef, useMemo, useState, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize } from '../constants/theme';

const KEYS: { label: string; kind: 'num' | 'op' | 'action'; value?: string }[] = [
  { label: 'C', kind: 'action', value: 'C' },
  { label: '⌫', kind: 'action', value: 'BACK' },
  { label: '%', kind: 'op', value: '%' },
  { label: '÷', kind: 'op', value: '/' },
  { label: '7', kind: 'num', value: '7' },
  { label: '8', kind: 'num', value: '8' },
  { label: '9', kind: 'num', value: '9' },
  { label: '×', kind: 'op', value: '*' },
  { label: '4', kind: 'num', value: '4' },
  { label: '5', kind: 'num', value: '5' },
  { label: '6', kind: 'num', value: '6' },
  { label: '−', kind: 'op', value: '-' },
  { label: '1', kind: 'num', value: '1' },
  { label: '2', kind: 'num', value: '2' },
  { label: '3', kind: 'num', value: '3' },
  { label: '+', kind: 'op', value: '+' },
  { label: '0', kind: 'num', value: '0' },
  { label: '.', kind: 'num', value: '.' },
  { label: '=', kind: 'action', value: '=' },
];

function safeEval(expr: string): number | null {
  if (!/^[0-9+\-*/.%() ]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr.replace(/%/g, '/100')})`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export interface CalculatorRef {
  open: () => void;
}

export default forwardRef<CalculatorRef>(function Calculator(_, ref) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.present(),
  }), []);

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: spacing.lg, gap: spacing.md },
    handle: { backgroundColor: colors.borderStrong },
    bg: { backgroundColor: colors.card },
    display: {
      backgroundColor: colors.bg,
      borderRadius: radius.md,
      padding: spacing.lg,
      alignItems: 'flex-end',
      gap: 4,
      minHeight: 96,
    },
    expr: { fontSize: fontSize.lg, color: colors.textSecondary },
    result: { fontSize: fontSize.display, fontWeight: '800', color: colors.textPrimary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    key: {
      width: `${(100 - 3 * 2) / 4}%`,
      aspectRatio: 1.4,
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

  function press(k: typeof KEYS[number]) {
    if (k.value === 'C') { setExpr(''); setResult(''); return; }
    if (k.value === 'BACK') { setExpr((e) => e.slice(0, -1)); return; }
    if (k.value === '=') {
      const r = safeEval(expr);
      setResult(r === null ? 'Error' : String(r));
      return;
    }
    setExpr((e) => e + k.value);
    const r = safeEval(expr + k.value);
    if (r !== null) setResult(String(r));
  }

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['65%']}
      handleStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.bg}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.container}>
        <View style={styles.display}>
          <Text style={styles.expr} numberOfLines={1}>{expr || ' '}</Text>
          <Text style={styles.result} numberOfLines={1}>{result || '0'}</Text>
        </View>
        <View style={styles.grid}>
          {KEYS.map((k) => (
            <Pressable
              key={k.label}
              style={[styles.key, k.kind === 'op' && styles.keyOp, k.kind === 'action' && styles.keyAction]}
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
      </View>
    </BottomSheetModal>
  );
});
