import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import type { TrendPoint } from '../../utils/report';
import { formatIDRCompact } from '../../utils/format';

interface Props {
  points: TrendPoint[];
  /** What the bars encode. */
  metric: 'savingsRate' | 'net' | 'expense';
  emptyLabel: string;
}

const H = 72;

/**
 * Small bar strip for the last N periods. Savings rate bars read 0..100 with
 * negatives drawn red below the baseline; money metrics scale to the max.
 */
export default function TrendMini({ points, metric, emptyLabel }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: H + 20 },
        col: { flex: 1, alignItems: 'center', gap: 4 },
        barWrap: { height: H, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
        bar: { width: '70%', borderTopLeftRadius: radius.xs, borderTopRightRadius: radius.xs, minHeight: 2 },
        value: { fontSize: 9, fontWeight: weight.bold, color: colors.textSecondary },
        label: { fontSize: fontSize.xs, color: colors.textMuted },
        labelCurrent: { color: colors.textPrimary, fontWeight: weight.bold },
        empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
      }),
    [colors],
  );

  const values = points.map((p) => (metric === 'savingsRate' ? p.savingsRate : metric === 'net' ? p.net : p.expense));
  const hasAny = values.some((v) => v !== null && v !== 0);
  if (!hasAny) return <Text style={styles.empty}>{emptyLabel}</Text>;

  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v ?? 0)), metric === 'savingsRate' ? 100 : 0);

  return (
    <View style={styles.row}>
      {points.map((p, i) => {
        const v = values[i];
        const ratio = v === null ? 0 : Math.min(1, Math.abs(v) / maxAbs);
        const negative = (v ?? 0) < 0;
        const color = negative ? colors.expense : metric === 'expense' ? colors.expense : colors.income;
        const text = v === null ? '-' : metric === 'savingsRate' ? `${Math.round(v)}%` : formatIDRCompact(v).replace('Rp ', '');
        return (
          <View key={p.startKey} style={styles.col} accessibilityLabel={`${p.label}: ${text}`}>
            <Text style={styles.value} numberOfLines={1}>{text}</Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { height: Math.max(2, ratio * H), backgroundColor: color, opacity: p.current ? 1 : 0.55 }]} />
            </View>
            <Text style={[styles.label, p.current && styles.labelCurrent]}>{p.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
