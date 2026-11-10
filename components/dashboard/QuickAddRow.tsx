import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CircleDollarSign, Plus } from 'lucide-react-native';
import IconBadge from '../ui/IconBadge';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useCategories } from '../../context/CategoriesContext';
import { Transaction } from '../../utils/storage';
import { addDays, isoDay } from '../../utils/date';
import { formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';

export interface QuickAddItem {
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  accountId: string;
  note: string;
  count: number;
}

const WINDOW_DAYS = 30;
const MAX_ITEMS = 6;

/** Distinct (type, category, amount, account) combos from the last 30 days, most frequent first. */
export function quickAddCandidates(txs: Transaction[]): QuickAddItem[] {
  const cutoff = isoDay(addDays(new Date(), -WINDOW_DAYS));
  const map = new Map<string, QuickAddItem>();
  for (const tx of txs) {
    if (tx.dayKey < cutoff) break; // list is newest first
    if (tx.type !== 'income' && tx.type !== 'expense') continue;
    const key = `${tx.type}|${tx.categoryId}|${tx.amount}|${tx.accountId}`;
    const hit = map.get(key);
    if (hit) hit.count += 1;
    else map.set(key, { type: tx.type, categoryId: tx.categoryId, amount: tx.amount, accountId: tx.accountId, note: tx.note, count: 1 });
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_ITEMS);
}

interface Props {
  items: QuickAddItem[];
  onPress: (item: QuickAddItem) => void;
}

export default function QuickAddRow({ items, onPress }: Props) {
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
        card: {
          width: 132,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: 6,
        },
        head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        name: { fontSize: fontSize.xs, fontWeight: weight.semibold, color: colors.textSecondary },
        amount: { fontSize: fontSize.md, fontWeight: weight.heavy, color: colors.textPrimary },
        plus: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
      }),
    [colors],
  );

  if (items.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const cat = find(item.categoryId);
        const tone = item.type === 'income' ? colors.income : colors.expense;
        const toneBg = item.type === 'income' ? colors.incomeLight : colors.expenseLight;
        return (
          <Pressable
            key={`${item.type}-${item.categoryId}-${item.amount}-${item.accountId}`}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityLabel={t('quickAdd.a11y', { name: cat?.name ?? t('common.other'), amount: formatIDRCompact(item.amount) })}
          >
            <View style={styles.head}>
              <IconBadge Icon={cat?.icon ?? CircleDollarSign} size={30} tint={tone} bg={toneBg} />
              <View style={styles.plus}>
                <Plus size={14} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {cat?.name ?? t('common.other')}
            </Text>
            <Text style={styles.amount} numberOfLines={1}>
              {formatIDRCompact(item.amount)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
