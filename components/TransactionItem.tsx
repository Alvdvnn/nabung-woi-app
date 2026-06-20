import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, Trash2, CircleDollarSign, ArrowRightLeft } from 'lucide-react-native';
import { radius, spacing, fontSize, shadow } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Transaction } from '../utils/storage';
import { useCategories } from '../context/CategoriesContext';
import { useAccounts } from '../context/DataContext';
import { formatIDR, formatDate } from '../utils/format';
import { useT } from '../i18n';

interface Props {
  item: Transaction;
  accountName?: string;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
}

function TransactionItemImpl({ item, accountName, onDelete, onPress }: Props) {
  const { colors } = useTheme();
  const { find } = useCategories();
  const accounts = useAccounts();
  const t = useT();

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
    iconTransfer: { backgroundColor: colors.primarySoft },
    info: { flex: 1 },
    category: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    meta: { fontSize: fontSize.xs, color: colors.textSecondary, maxWidth: 140 },
    metaDot: { fontSize: fontSize.xs, color: colors.textMuted },
    date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 8 },
    amount: { fontSize: fontSize.lg, fontWeight: '700' },
    incomeText: { color: colors.income },
    expenseText: { color: colors.expense },
    transferText: { color: colors.primary },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    iconBtn: { padding: 4 },
    editBtn: { padding: 4 },
  }), [colors]);

  const cat = find(item.categoryId);

  const isIncome = item.type === 'income';
  const isTransfer = item.type === 'transfer';

  const Icon = isTransfer ? ArrowRightLeft : (cat?.icon ?? CircleDollarSign);
  const iconBg = isTransfer ? styles.iconTransfer : (isIncome ? styles.iconIncome : styles.iconExpense);
  const iconColor = isTransfer ? colors.primary : (isIncome ? colors.income : colors.expense);

  const title = isTransfer ? t('type.transfer') : (cat?.name ?? t('common.other'));

  // For transfers, show "source → destination" instead of just the source.
  const toName = isTransfer && item.toAccountId
    ? accounts.find((a) => a.id === item.toAccountId)?.name
    : undefined;
  const accountLabel = isTransfer && toName
    ? `${accountName ?? ''} → ${toName}`
    : accountName;

  const amountColor = isTransfer ? styles.transferText : (isIncome ? styles.incomeText : styles.expenseText);
  const amountSign = isTransfer ? '' : (isIncome ? '+' : '-');

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, iconBg]}>
        <Icon size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{title}</Text>
        <View style={styles.metaRow}>
          {accountLabel ? <Text style={styles.meta}>{accountLabel}</Text> : null}
          {item.note ? <Text style={styles.metaDot}>•</Text> : null}
          {item.note ? <Text style={styles.meta} numberOfLines={1}>{item.note}</Text> : null}
        </View>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, amountColor]}>
          {amountSign}{formatIDR(item.amount)}
        </Text>
        {(onPress || onDelete) && (
          <View style={styles.actionsRow}>
            {onPress && (
              <Pressable onPress={() => onPress(item.id)} hitSlop={8} style={styles.editBtn}>
                <Pencil size={14} color={colors.textMuted} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={styles.iconBtn}>
                <Trash2 size={14} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const TransactionItem = memo(TransactionItemImpl);
export default TransactionItem;
