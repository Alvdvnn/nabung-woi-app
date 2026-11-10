import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Delete, History, Trash2 } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { groupDigits } from '../../utils/format';
import { hapticLight } from '../../utils/haptics';
import { useT } from '../../i18n';
import {
  CalcKey,
  CalcState,
  INITIAL_CALC,
  expressionText,
  preview as previewOf,
  reduce,
} from '../../utils/calc';
import { CALC_HISTORY_MAX, CalcHistoryEntry, getCalcHistory, setCalcHistory } from '../../utils/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply?: (value: number) => void;
}

type Kind = 'num' | 'op' | 'fn' | 'eq';
interface KeyDef { label: string; key: CalcKey; kind: Kind }

const ROWS: KeyDef[][] = [
  [
    { label: 'AC', key: 'clear', kind: 'fn' },
    { label: '±', key: 'neg', kind: 'fn' },
    { label: '%', key: '%', kind: 'fn' },
    { label: '÷', key: '/', kind: 'op' },
  ],
  [
    { label: '7', key: '7', kind: 'num' },
    { label: '8', key: '8', kind: 'num' },
    { label: '9', key: '9', kind: 'num' },
    { label: '×', key: '*', kind: 'op' },
  ],
  [
    { label: '4', key: '4', kind: 'num' },
    { label: '5', key: '5', kind: 'num' },
    { label: '6', key: '6', kind: 'num' },
    { label: '−', key: '-', kind: 'op' },
  ],
  [
    { label: '1', key: '1', kind: 'num' },
    { label: '2', key: '2', kind: 'num' },
    { label: '3', key: '3', kind: 'num' },
    { label: '+', key: '+', kind: 'op' },
  ],
  [
    { label: '0', key: '0', kind: 'num' },
    { label: '.', key: '.', kind: 'num' },
    { label: '⌫', key: 'back', kind: 'fn' },
    { label: '=', key: '=', kind: 'eq' },
  ],
];

/** Formats a typed number: thousands grouping, decimal comma, keeps a trailing dot. */
function fmtNum(text: string): string {
  const neg = text.startsWith('-');
  const body = neg ? text.slice(1) : text;
  const [i, d] = body.split('.');
  const int = i ? groupDigits(i) : '0';
  const dec = d !== undefined ? ',' + d : body.endsWith('.') ? ',' : '';
  return (neg ? '-' : '') + int + dec;
}

function fmtResult(n: number): string {
  return fmtNum(String(n));
}

/**
 * Phone-style calculator in a sheet. The expression shows as typed, the result
 * appears only after '=' (a faint live preview sits above it), history is
 * persisted and tappable, and the result can be applied to the amount field.
 */
export default function Calculator({ visible, onClose, onApply }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [state, setState] = useState<CalcState>(INITIAL_CALC);
  const [history, setHistory] = useState<CalcHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (visible) getCalcHistory().then(setHistory);
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        display: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          gap: 4,
          minHeight: 104,
        },
        expr: { fontSize: fontSize.lg, color: colors.textPrimary, fontWeight: weight.semibold, textAlign: 'right' },
        exprMuted: { color: colors.textSecondary },
        previewText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'right' },
        result: { fontSize: fontSize.display, lineHeight: 40, fontWeight: weight.black, color: colors.textPrimary, textAlign: 'right', letterSpacing: -0.5 },
        errorText: { color: colors.expense },
        toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: spacing.sm, borderRadius: radius.full },
        toolText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.primary },
        grid: { gap: spacing.sm },
        row: { flexDirection: 'row', gap: spacing.sm },
        key: {
          flex: 1,
          height: 56,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        keyFn: { backgroundColor: colors.surfaceSunken },
        keyOp: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
        keyEq: { backgroundColor: colors.primary, borderColor: colors.primary },
        keyLabel: { fontSize: fontSize.xl, fontWeight: weight.bold, color: colors.textPrimary },
        keyLabelOp: { color: colors.primary },
        keyLabelEq: { color: colors.onPrimary },
        histList: { maxHeight: 220, gap: spacing.xs },
        histRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          minHeight: 48,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        histExpr: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted },
        histResult: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        histEmpty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
      }),
    [colors],
  );

  const press = useCallback(
    (key: CalcKey) => {
      hapticLight();
      setState((prev) => {
        const next = reduce(prev, key);
        if (key === '=' && !prev.evaluated && next.evaluated && next.result !== null) {
          const entry: CalcHistoryEntry = {
            expr: expressionText(next, fmtNum),
            result: next.result,
            at: new Date().toISOString(),
          };
          setHistory((h) => {
            const list = [entry, ...h].slice(0, CALC_HISTORY_MAX);
            setCalcHistory(list).catch(() => {});
            return list;
          });
        }
        return next;
      });
    },
    [],
  );

  const reuse = (entry: CalcHistoryEntry) => {
    setState({ ...INITIAL_CALC, current: String(entry.result) });
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    setCalcHistory([]).catch(() => {});
  };

  const expr = expressionText(state, fmtNum);
  const live = previewOf(state);
  const applyValue = state.evaluated && state.result !== null ? state.result : (live ?? (state.current ? Number(state.current) : null));
  const clearLabel = state.current || state.tokens.length ? 'C' : 'AC';

  return (
    <Sheet
      visible={visible}
      title={t('calc.title')}
      onClose={onClose}
      footer={
        onApply ? (
          <Button
            label={t('calc.useAmount')}
            onPress={() => applyValue !== null && onApply(Math.round(Math.abs(applyValue)))}
            disabled={applyValue === null || !Number.isFinite(applyValue)}
            size="lg"
          />
        ) : undefined
      }
    >
      <View style={{ gap: spacing.md }}>
        <View style={styles.display} accessibilityLiveRegion="polite">
          {state.error ? (
            <Text style={[styles.result, styles.errorText]}>{t('calc.error')}</Text>
          ) : state.evaluated && state.result !== null ? (
            <>
              <Text style={[styles.expr, styles.exprMuted]} numberOfLines={1}>
                {expr || ' '}
              </Text>
              <Text style={styles.result} numberOfLines={1} adjustsFontSizeToFit>
                {`= ${fmtResult(state.result)}`}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.previewText} numberOfLines={1}>
                {live !== null ? `= ${fmtResult(live)}` : ' '}
              </Text>
              <Text style={styles.result} numberOfLines={1} adjustsFontSizeToFit>
                {expr || '0'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={styles.toolBtn}
            onPress={() => setShowHistory((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showHistory }}
          >
            <History size={16} color={colors.primary} />
            <Text style={styles.toolText}>{t('calc.history')}</Text>
          </Pressable>
          {showHistory && history.length > 0 ? (
            <Pressable style={styles.toolBtn} onPress={clearHistory} accessibilityRole="button">
              <Trash2 size={16} color={colors.textMuted} />
              <Text style={[styles.toolText, { color: colors.textMuted }]}>{t('calc.clearHistory')}</Text>
            </Pressable>
          ) : null}
        </View>

        {showHistory ? (
          history.length === 0 ? (
            <Text style={styles.histEmpty}>{t('calc.noHistory')}</Text>
          ) : (
            <ScrollView style={styles.histList} contentContainerStyle={{ gap: spacing.xs }} showsVerticalScrollIndicator={false}>
              {history.map((h, i) => (
                <Pressable
                  key={`${h.at}-${i}`}
                  style={({ pressed }) => [styles.histRow, pressed && { backgroundColor: colors.surfaceSunken }]}
                  onPress={() => reuse(h)}
                  accessibilityRole="button"
                  accessibilityLabel={`${h.expr} = ${fmtResult(h.result)}`}
                >
                  <Text style={styles.histExpr} numberOfLines={1}>{h.expr}</Text>
                  <Text style={styles.histResult}>{fmtResult(h.result)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )
        ) : (
          <View style={styles.grid}>
            {ROWS.map((row, i) => (
              <View key={i} style={styles.row}>
                {row.map((k) => (
                  <Pressable
                    key={k.key}
                    style={({ pressed }) => [
                      styles.key,
                      k.kind === 'fn' && styles.keyFn,
                      k.kind === 'op' && styles.keyOp,
                      k.kind === 'eq' && styles.keyEq,
                      pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => press(k.key)}
                    accessibilityRole="button"
                    accessibilityLabel={k.key === 'back' ? t('pinLock.backspace') : k.key === 'clear' ? clearLabel : k.label}
                  >
                    {k.key === 'back' ? (
                      <Delete size={22} color={colors.textPrimary} />
                    ) : (
                      <Text style={[styles.keyLabel, k.kind === 'op' && styles.keyLabelOp, k.kind === 'eq' && styles.keyLabelEq]}>
                        {k.key === 'clear' ? clearLabel : k.label}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </Sheet>
  );
}
