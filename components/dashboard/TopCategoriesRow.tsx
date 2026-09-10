import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CircleDollarSign } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { chartPalette, fontSize, radius, spacing, weight } from '../../constants/theme';
import { CategorySum } from '../../utils/aggregate';
import { useCategories } from '../../context/CategoriesContext';
import { formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  data: CategorySum[];
  total: number;
  onPress?: (categoryId: string) => void;
}

// Beyond this the pie chart below tells the fuller story.
const MAX_CARDS = 8;

export default function TopCategoriesRow({ data, total, onPress }: Props) {
  const { colors, resolved } = useTheme();
  const { find } = useCategories();
  const t = useT();
  const palette = chartPalette(resolved);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
        card: {
          width: 136,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: 6,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        name: { fontSize: fontSize.xs, fontWeight: weight.semibold, color: colors.textSecondary },
        amount: { fontSize: fontSize.md, fontWeight: weight.heavy, color: colors.textPrimary },
        bar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
        fill: { height: '100%', borderRadius: 2 },
        pct: { fontSize: 10, color: colors.textMuted, fontWeight: weight.semibold },
      }),
    [colors],
  );

  const cards = useMemo(() => data.slice(0, MAX_CARDS), [data]);
  if (cards.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {cards.map((c, i) => {
        const cat = find(c.categoryId);
        const Icon = cat?.icon ?? CircleDollarSign;
        const pct = total > 0 ? Math.min(100, Math.round((c.total / total) * 100)) : 0;
        const color = palette[i % palette.length];
        return (
          <Pressable
            key={c.categoryId}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
            onPress={onPress ? () => onPress(c.categoryId) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`${cat?.name ?? t('common.other')}, ${formatIDRCompact(c.total)}, ${pct}%`}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
              <Icon size={16} color={color} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {cat?.name ?? t('common.other')}
            </Text>
            <Text style={styles.amount} numberOfLines={1}>
              {formatIDRCompact(c.total)}
            </Text>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.pct}>{`${pct}% ${t('report.ofExpenses')}`}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
