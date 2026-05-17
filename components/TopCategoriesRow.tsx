import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, shadow } from '../constants/theme';
import { CategorySum } from '../utils/aggregate';
import { findCategory } from '../constants/categories';
import { formatIDRCompact } from '../utils/format';

interface Props {
  data: CategorySum[];
  total: number;
}

export default function TopCategoriesRow({ data, total }: Props) {
  const { colors } = useTheme();
  const top3 = data.slice(0, 3);

  const styles = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 6,
      ...shadow.card,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
    amount: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textPrimary },
    bar: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: colors.primary },
    empty: { padding: spacing.md, alignItems: 'center' },
    emptyText: { fontSize: fontSize.sm, color: colors.textMuted },
  }), [colors]);

  if (top3.length === 0) return null;

  return (
    <View style={styles.row}>
      {top3.map((c) => {
        const cat = findCategory(c.categoryId);
        const Icon = cat?.icon;
        const pct = total > 0 ? Math.min(100, Math.round((c.total / total) * 100)) : 0;
        return (
          <View key={c.categoryId} style={styles.card}>
            <View style={styles.iconWrap}>
              {Icon && <Icon size={16} color={colors.primary} />}
            </View>
            <Text style={styles.name} numberOfLines={1}>{cat?.name ?? 'Other'}</Text>
            <Text style={styles.amount}>{formatIDRCompact(c.total)}</Text>
            <View style={styles.bar}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
          </View>
        );
      })}
    </View>
  );
}
