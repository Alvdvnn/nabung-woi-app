import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trash2, CircleDollarSign } from 'lucide-react-native';
import { radius, spacing, fontSize, shadow } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Transaction } from '../utils/storage';
import { useCategories } from '../context/CategoriesContext';
import { formatIDR, formatDate } from '../utils/format';

interface Props {
  item: Transaction;
  accountName?: string;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
}

export default function TransactionItem({ item, accountName, onDelete, onPress }: Props) {
  const { colors } = useTheme();
  const { find } = useCategories();
  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.card,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    iconIncome: { backgroundColor: colors.incomeLight },
    iconExpense: { backgroundColor: colors.expenseLight },
    info: { flex: 1 },
    category: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    meta: { fontSize: fontSize.xs, color: colors.textSecondary, maxWidth: 140 },
    metaDot: { fontSize: fontSize.xs, color: colors.textMuted },
    date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 6 },
    amount: { fontSize: fontSize.md, fontWeight: '700' },
    incomeText: { color: colors.income },
    expenseText: { color: colors.expense },
    delBtn: { padding: 4 },
  }), [colors]);

  const cat = find(item.categoryId);
  const Icon = cat?.icon ?? CircleDollarSign;
  const isIncome = item.type === 'income';
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper style={styles.row} onPress={onPress ? () => onPress(item.id) : undefined}>
      <View style={[styles.iconWrap, isIncome ? styles.iconIncome : styles.iconExpense]}>
        <Icon size={18} color={isIncome ? colors.income : colors.expense} />
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{cat?.name ?? 'Other'}</Text>
        <View style={styles.metaRow}>
          {accountName ? <Text style={styles.meta}>{accountName}</Text> : null}
          {item.note ? <Text style={styles.metaDot}>•</Text> : null}
          {item.note ? <Text style={styles.meta} numberOfLines={1}>{item.note}</Text> : null}
        </View>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, isIncome ? styles.incomeText : styles.expenseText]}>
          {isIncome ? '+' : '-'}{formatIDR(item.amount)}
        </Text>
        {onDelete && (
          <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={styles.delBtn}>
            <Trash2 size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Wrapper>
  );
}
