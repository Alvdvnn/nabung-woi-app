import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { radius, spacing, fontSize, shadow } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { CategorySum } from '../utils/aggregate';
import { useCategories } from '../context/CategoriesContext';
import { formatIDR } from '../utils/format';
import { useT } from '../i18n';

interface Props {
  data: CategorySum[];
  total: number;
}

const MAX_SLICES = 6;
const SLICE_COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#84cc16', '#f97316'];
const OTHER_COLOR = '#94a3b8';

export default function PieChartCard({ data, total }: Props) {
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.lg,
      ...shadow.card,
    },
    title: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
    chartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    centerLabel: { fontSize: fontSize.xs, color: colors.textMuted },
    centerValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
    legend: { flex: 1, gap: spacing.xs },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendName: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary },
    legendPct: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  }), [colors]);

  if (data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{t('pie.title')}</Text>
        <Text style={styles.empty}>{t('pie.empty')}</Text>
      </View>
    );
  }

  // Cap to MAX_SLICES; aggregate the tail into an "Other" slice so the
  // donut and legend show the same set of slices.
  const topSlices = data.slice(0, MAX_SLICES);
  const tail = data.slice(MAX_SLICES);
  const otherTotal = tail.reduce((sum, d) => sum + d.total, 0);
  const visible = otherTotal > 0
    ? [...topSlices, { categoryId: '__other__', total: otherTotal }]
    : topSlices;

  const pieData = visible.map((d, i) => ({
    value: d.total,
    color: d.categoryId === '__other__' ? OTHER_COLOR : SLICE_COLORS[i % SLICE_COLORS.length],
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('pie.title')}</Text>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={45}
          innerCircleColor={colors.card}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.centerLabel}>{t('pie.total')}</Text>
              <Text style={styles.centerValue}>{formatIDR(total)}</Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {visible.map((d, i) => {
            const isOther = d.categoryId === '__other__';
            const cat = isOther ? undefined : find(d.categoryId);
            const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
            const color = isOther ? OTHER_COLOR : SLICE_COLORS[i % SLICE_COLORS.length];
            const name = isOther ? t('pie.other') : (cat?.name ?? t('common.other'));
            return (
              <View key={d.categoryId} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.legendName} numberOfLines={1}>{name}</Text>
                <Text style={styles.legendPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
