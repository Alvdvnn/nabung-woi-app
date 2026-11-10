import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { formatIDRCompact } from '../../utils/format';
import type { ReportBucket } from '../../utils/report';

interface Props {
  buckets: ReportBucket[];
  incomeLabel: string;
  expenseLabel: string;
  /** Makes columns tappable. */
  onPressBucket?: (index: number) => void;
  selectedIndex?: number | null;
  emptyLabel?: string;
}

const CHART_HEIGHT = 132;
// Past this many columns the chart scrolls instead of squeezing bars to slivers.
const SCROLL_THRESHOLD = 14;
const COLUMN_WIDTH = 28;

/**
 * Grouped income/expense bars, drawn with plain views.
 *
 * A charting library would pull in an SVG renderer for what is a pair of scaled
 * rectangles per bucket; this stays theme-aware, works identically on web, and
 * costs one layout pass. Columns are 44pt-tall touch targets when tappable.
 */
export default function TrendChart({ buckets, incomeLabel, expenseLabel, onPressBucket, selectedIndex, emptyLabel }: Props) {
  const { colors } = useTheme();

  const max = useMemo(
    () => buckets.reduce((m, b) => Math.max(m, b.income, b.expense), 0),
    [buckets],
  );

  // Label every column when there are few, every 5th when the month view packs
  // in 28-31 of them.
  const labelEvery = buckets.length > 16 ? 5 : buckets.length > 8 ? 2 : 1;
  const scrolls = buckets.length > SCROLL_THRESHOLD;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.md },
        legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        legendDot: { width: 8, height: 8, borderRadius: 4 },
        legendText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: weight.semibold },
        maxText: { flex: 1, textAlign: 'right', fontSize: fontSize.xs, color: colors.textMuted },
        plot: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, gap: 2 },
        column: { alignItems: 'center', justifyContent: 'flex-end', gap: 4, borderRadius: radius.xs },
        columnSelected: { backgroundColor: colors.surfaceSunken },
        bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: CHART_HEIGHT - 18 },
        bar: { width: 8, borderTopLeftRadius: radius.xs, borderTopRightRadius: radius.xs, minHeight: 2 },
        label: { fontSize: 9, color: colors.textMuted, height: 12 },
        baseline: { height: 1, backgroundColor: colors.border },
        empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
      }),
    [colors],
  );

  if (max === 0) {
    return <Text style={styles.empty}>{emptyLabel ?? '-'}</Text>;
  }

  const plotHeight = CHART_HEIGHT - 18;

  const columns = (
    <View style={[styles.plot, !scrolls && { justifyContent: 'space-between' }]}>
      {buckets.map((b, i) => {
        const incomeH = Math.round((b.income / max) * plotHeight);
        const expenseH = Math.round((b.expense / max) * plotHeight);
        const showLabel = i % labelEvery === 0 || i === buckets.length - 1;
        const selected = selectedIndex === i;
        const dim = selectedIndex != null && !selected;
        return (
          <Pressable
            key={b.key}
            style={[styles.column, scrolls ? { width: COLUMN_WIDTH } : { flex: 1 }, selected && styles.columnSelected]}
            onPress={onPressBucket ? () => onPressBucket(i) : undefined}
            disabled={!onPressBucket}
            accessibilityRole={onPressBucket ? 'button' : undefined}
            accessibilityState={{ selected }}
            accessibilityLabel={`${b.label}: ${incomeLabel} ${formatIDRCompact(b.income)}, ${expenseLabel} ${formatIDRCompact(b.expense)}`}
          >
            <View style={styles.bars}>
              <View style={[styles.bar, { height: incomeH, backgroundColor: colors.income, opacity: dim ? 0.4 : 1 }]} />
              <View style={[styles.bar, { height: expenseH, backgroundColor: colors.expense, opacity: dim ? 0.4 : 1 }]} />
            </View>
            <Text style={[styles.label, selected && { color: colors.textPrimary, fontWeight: weight.bold }]} numberOfLines={1}>
              {showLabel || selected ? b.label : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>{incomeLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>{expenseLabel}</Text>
        </View>
        <Text style={styles.maxText}>{formatIDRCompact(max)}</Text>
      </View>

      {scrolls ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {columns}
        </ScrollView>
      ) : (
        columns
      )}
      <View style={styles.baseline} />
    </View>
  );
}
