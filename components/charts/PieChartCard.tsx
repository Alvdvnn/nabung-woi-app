import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Card from '../ui/Card';
import { chartMuted, chartPalette, fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { CategorySum } from '../../utils/aggregate';
import { useCategories } from '../../context/CategoriesContext';
import { formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  data: CategorySum[];
  total: number;
}

const MAX_SLICES = 6;

export default function PieChartCard({ data, total }: Props) {
  const { colors, resolved } = useTheme();
  const { find } = useCategories();
  const t = useT();

  // Slice colors follow the theme instead of being fixed hexes, so the donut
  // keeps its contrast in dark mode.
  const palette = chartPalette(resolved);
  const otherColor = chartMuted(resolved);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        title: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary, marginBottom: spacing.md },
        empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
        chartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
        centerLabel: { fontSize: fontSize.xs, color: colors.textMuted },
        centerValue: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textPrimary, marginTop: 2 },
        legend: { flex: 1, gap: spacing.sm },
        legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        dot: { width: 10, height: 10, borderRadius: 5 },
        legendName: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary },
        legendPct: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textSecondary },
      }),
    [colors],
  );

  const visible = useMemo(() => {
    // Cap at MAX_SLICES and fold the tail into "Other" so the donut and the
    // legend always describe the same set of slices.
    const head = data.slice(0, MAX_SLICES);
    const tail = data.slice(MAX_SLICES).reduce((sum, d) => sum + d.total, 0);
    return tail > 0 ? [...head, { categoryId: '__other__', total: tail }] : head;
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>{t('pie.title')}</Text>
        <Text style={styles.empty}>{t('pie.empty')}</Text>
      </Card>
    );
  }

  const colorFor = (categoryId: string, i: number) =>
    categoryId === '__other__' ? otherColor : palette[i % palette.length];

  const pieData = visible.map((d, i) => ({ value: d.total, color: colorFor(d.categoryId, i) }));

  return (
    <Card>
      <Text style={styles.title} accessibilityRole="header">
        {t('pie.title')}
      </Text>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={46}
          innerCircleColor={colors.surface}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.centerLabel}>{t('pie.total')}</Text>
              <Text style={styles.centerValue}>{formatIDRCompact(total)}</Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {visible.map((d, i) => {
            const isOther = d.categoryId === '__other__';
            const name = isOther ? t('pie.other') : (find(d.categoryId)?.name ?? t('common.other'));
            const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
            return (
              <View key={d.categoryId} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: colorFor(d.categoryId, i) }]} />
                <Text style={styles.legendName} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.legendPct}>{`${pct}%`}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}
