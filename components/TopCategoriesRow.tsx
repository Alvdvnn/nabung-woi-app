import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, shadow } from '../constants/theme';
import { CategorySum } from '../utils/aggregate';
import { useCategories } from '../context/CategoriesContext';
import { formatIDRCompact } from '../utils/format';

interface Props {
  data: CategorySum[];
  total: number;
  onPress?: (categoryId: string) => void;
}

export default function TopCategoriesRow({ data, total, onPress }: Props) {
  const { colors } = useTheme();
  const { find } = useCategories();

  const styles = useMemo(() => StyleSheet.create({
    scrollContent: { 
      flexDirection: 'row', 
      gap: spacing.sm, 
      paddingBottom: spacing.sm, 
      paddingRight: spacing.lg,  
    },
    card: {
      width: 130,
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

  // Hapus batasan top3, biarkan me-render seluruh data
  if (data.length === 0) return null;

  return (
    <View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((c) => {
          const cat = find(c.categoryId);
          const Icon = cat?.icon;
          const pct = total > 0 ? Math.min(100, Math.round((c.total / total) * 100)) : 0;
          return (
            <Pressable
              key={c.categoryId}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
              onPress={onPress ? () => onPress(c.categoryId) : undefined}
            >
              <View style={styles.iconWrap}>
                {Icon && <Icon size={16} color={colors.primary} />}
              </View>
              <Text style={styles.name} numberOfLines={1}>{cat?.name ?? 'Other'}</Text>
              <Text style={styles.amount}>{formatIDRCompact(c.total)}</Text>
              <View style={styles.bar}>
                <View style={[styles.fill, { width: `${pct}%` }]} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}