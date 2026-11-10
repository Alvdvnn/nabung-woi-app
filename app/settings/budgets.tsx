import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PiggyBank } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import ProgressBar from '../../components/ui/ProgressBar';
import Card from '../../components/ui/Card';
import BudgetSheet from '../../components/settings/BudgetSheet';
import { fontSize, spacing, weight } from '../../constants/theme';
import { CategoryDef } from '../../constants/categories';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { usePrefs } from '../../context/PrefsContext';
import { filterByRange, sumByCategory } from '../../utils/aggregate';
import { rangeFor } from '../../utils/period';
import { formatIDR, formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';

/** One monthly cap per expense category. Shows this month's progress inline. */
export default function BudgetsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const { txs } = useData();
  const { byType } = useCategories();
  const { budgetsByCategory } = usePrefs();
  const [target, setTarget] = useState<CategoryDef | null>(null);

  const spentByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of sumByCategory(filterByRange(txs, rangeFor('month')), 'expense')) m.set(row.categoryId, row.total);
    return m;
  }, [txs]);

  const categories = byType('expense');
  const withBudget = categories.filter((c) => budgetsByCategory.has(c.id));
  const without = categories.filter((c) => !budgetsByCategory.has(c.id));

  const totals = useMemo(() => {
    let budget = 0;
    let spent = 0;
    for (const c of withBudget) {
      budget += budgetsByCategory.get(c.id) ?? 0;
      spent += spentByCategory.get(c.id) ?? 0;
    }
    return { budget, spent };
  }, [withBudget, budgetsByCategory, spentByCategory]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        summaryLabel: { fontSize: fontSize.xs, fontWeight: weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
        summaryValue: { fontSize: fontSize.xxl, fontWeight: weight.black, color: colors.textPrimary, marginTop: 2 },
        summaryMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm },
        intro: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, paddingHorizontal: spacing.xs },
      }),
    [colors, insets.bottom],
  );

  const rowFor = (c: CategoryDef) => {
    const budget = budgetsByCategory.get(c.id);
    const spent = spentByCategory.get(c.id) ?? 0;
    const left = budget ? budget - spent : 0;
    return (
      <ListRow
        key={c.id}
        Icon={c.icon}
        title={c.name}
        subtitle={
          budget
            ? left >= 0
              ? t('budget.left', { n: formatIDRCompact(left) })
              : t('budget.over', { n: formatIDRCompact(-left) })
            : spent > 0
              ? t('budget.spentThisMonth', { n: formatIDRCompact(spent) })
              : t('budget.none')
        }
        value={budget ? formatIDRCompact(budget) : undefined}
        valueColor={budget && left < 0 ? colors.expense : undefined}
        trailing="chevron"
        onPress={() => setTarget(c)}
      />
    );
  };

  return (
    <Screen>
      <TopBar title={t('settings.budgets')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {withBudget.length > 0 ? (
          <Card>
            <Text style={styles.summaryLabel}>{t('budget.thisMonth')}</Text>
            <Text style={styles.summaryValue}>{formatIDR(totals.spent)}</Text>
            <ProgressBar value={totals.budget > 0 ? totals.spent / totals.budget : 0} style={{ marginTop: spacing.md }} />
            <Text style={styles.summaryMeta}>{t('budget.spentOf', { spent: formatIDR(totals.spent), budget: formatIDR(totals.budget) })}</Text>
          </Card>
        ) : (
          <Text style={styles.intro}>{t('budget.intro')}</Text>
        )}

        {withBudget.length > 0 ? (
          <SectionGroup title={t('budget.withBudget')}>{withBudget.map(rowFor)}</SectionGroup>
        ) : null}
        {without.length > 0 ? (
          <SectionGroup title={t('budget.withoutBudget')} footer={t('budget.footer')}>
            {without.map(rowFor)}
          </SectionGroup>
        ) : null}
        <View />
      </ScrollView>

      <BudgetSheet
        visible={!!target}
        category={target}
        spent={target ? spentByCategory.get(target.id) ?? 0 : 0}
        onClose={() => setTarget(null)}
      />
    </Screen>
  );
}

export const BudgetsIcon = PiggyBank;
