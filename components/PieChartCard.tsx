import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { colors, radius, spacing, fontSize, shadow } from '../constants/theme';
import { CategorySum } from '../utils/aggregate';
import { findCategory } from '../constants/categories';
import { formatIDR } from '../utils/format';

interface Props {
  data: CategorySum[];
  total: number;
}

const SLICE_COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#2563eb', '#0ea5e9', '#0284c7'];

export default function PieChartCard({ data, total }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Spending by Category</Text>
        <Text style={styles.empty}>No expenses in this period yet.</Text>
      </View>
    );
  }

  const pieData = data.map((d, i) => ({
    value: d.total,
    color: SLICE_COLORS[i % SLICE_COLORS.length],
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Spending by Category</Text>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={45}
          innerCircleColor={colors.card}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.centerLabel}>Total</Text>
              <Text style={styles.centerValue}>{formatIDR(total)}</Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {data.slice(0, 6).map((d, i) => {
            const cat = findCategory(d.categoryId);
            const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
            return (
              <View key={d.categoryId} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }]} />
                <Text style={styles.legendName} numberOfLines={1}>{cat?.name ?? 'Other'}</Text>
                <Text style={styles.legendPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
