import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CircleDollarSign } from 'lucide-react-native';
import Card from '../ui/Card';
import IconBadge from '../ui/IconBadge';
import ProgressBar from '../ui/ProgressBar';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useCategories } from '../../context/CategoriesContext';
import { formatIDRCompact } from '../../utils/format';
import type { BudgetProgress } from '../../utils/report';
import { useT } from '../../i18n';

interface Props {
  budgets: BudgetProgress[];
  max?: number;
  onPressCategory?: (categoryId: string) => void;
}

/** Top budgets by usage with progress bars. Red once over. */
export default function BudgetsCard({ budgets, max = 3, onPressCategory }: Props) {
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { gap: spacing.md },
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        main: { flex: 1, gap: 6 },
        head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
        name: { flex: 1, fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textPrimary },
        amount: { fontSize: fontSize.xs, fontWeight: weight.bold, color: colors.textSecondary },
      }),
    [colors],
  );

  const rows = budgets.slice(0, max);
  if (rows.length === 0) return null;

  return (
    <Card>
      <View style={styles.list}>
        {rows.map((b) => {
          const cat = find(b.categoryId);
          const over = b.ratio > 1;
          const left = b.budget - b.spent;
          const content = (
            <View style={styles.row}>
              <IconBadge
                Icon={cat?.icon ?? CircleDollarSign}
                size={36}
                tint={over ? colors.expense : colors.primary}
                bg={over ? colors.expenseLight : colors.primarySoft}
              />
              <View style={styles.main}>
                <View style={styles.head}>
                  <Text style={styles.name} numberOfLines={1}>
                    {cat?.name ?? t('common.other')}
                  </Text>
                  <Text style={[styles.amount, over && { color: colors.expense }]}>
                    {over
                      ? t('budget.over', { n: formatIDRCompact(-left) })
                      : t('budget.left', { n: formatIDRCompact(left) })}
                  </Text>
                </View>
                <ProgressBar value={b.ratio} color={b.ratio > 0.85 ? colors.warning : colors.primary} />
              </View>
            </View>
          );
          if (!onPressCategory) return <View key={b.categoryId}>{content}</View>;
          return (
            <Pressable
              key={b.categoryId}
              onPress={() => onPressCategory(b.categoryId)}
              accessibilityRole="button"
              accessibilityLabel={`${cat?.name ?? ''}, ${formatIDRCompact(b.spent)} / ${formatIDRCompact(b.budget)}`}
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              {content}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
