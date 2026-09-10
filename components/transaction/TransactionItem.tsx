import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  CircleDollarSign,
  Pencil,
  Scale,
  Trash2,
} from 'lucide-react-native';
import { elevation, fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Transaction } from '../../utils/storage';
import { useCategories } from '../../context/CategoriesContext';
import { useData } from '../../context/DataContext';
import { formatIDR, formatDate } from '../../utils/format';
import { useT } from '../../i18n';

/** Fixed row height lets FlatList skip measurement (see getItemLayout). */
export const TRANSACTION_ROW_HEIGHT = 80;
const ROW_GAP = spacing.sm;
export const TRANSACTION_ITEM_HEIGHT = TRANSACTION_ROW_HEIGHT + ROW_GAP;

interface Props {
  item: Transaction;
  accountName?: string;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
}

function TransactionItemImpl({ item, accountName, onDelete, onPress }: Props) {
  const { colors, resolved } = useTheme();
  const { find } = useCategories();
  const { accountsById } = useData();
  const t = useT();

  const isIncome = item.type === 'income';
  const isTransfer = item.type === 'transfer';
  const isAdjustment = item.type === 'adjustment';
  const adjustsUp = isAdjustment && item.direction === 'in';

  const tone = useMemo(() => {
    if (isAdjustment) return { fg: colors.adjustment, bg: colors.adjustmentLight };
    if (isTransfer) return { fg: colors.transfer, bg: colors.transferLight };
    if (isIncome) return { fg: colors.income, bg: colors.incomeLight };
    return { fg: colors.expense, bg: colors.expenseLight };
  }, [isAdjustment, isTransfer, isIncome, colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          height: TRANSACTION_ROW_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          marginBottom: ROW_GAP,
          borderWidth: 1,
          borderColor: colors.border,
          ...(resolved === 'dark' ? {} : elevation[1]),
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          backgroundColor: tone.bg,
        },
        info: { flex: 1, gap: 2 },
        titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        category: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.textPrimary, flexShrink: 1 },
        badge: {
          paddingHorizontal: 6,
          paddingVertical: 1,
          borderRadius: radius.xs,
          backgroundColor: tone.bg,
        },
        badgeText: { fontSize: 9, fontWeight: weight.heavy, color: tone.fg, letterSpacing: 0.4, textTransform: 'uppercase' },
        meta: { fontSize: fontSize.xs, color: colors.textSecondary },
        date: { fontSize: fontSize.xs, color: colors.textMuted },
        right: { alignItems: 'flex-end', gap: 2, marginLeft: spacing.sm },
        amount: { fontSize: fontSize.md, fontWeight: weight.heavy, color: tone.fg, letterSpacing: -0.2 },
        actionsRow: { flexDirection: 'row', alignItems: 'center' },
        iconBtn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
      }),
    [colors, resolved, tone],
  );

  const cat = find(item.categoryId);

  const Icon = isAdjustment
    ? Scale
    : isTransfer
      ? ArrowRightLeft
      : (cat?.icon ?? (isIncome ? ArrowUpRight : ArrowDownRight) ?? CircleDollarSign);

  const title = isAdjustment
    ? t('type.adjustment')
    : isTransfer
      ? t('type.transfer')
      : (cat?.name ?? t('common.other'));

  // Transfers read as "source -> destination"; everything else names one account.
  const toName = isTransfer && item.toAccountId ? accountsById.get(item.toAccountId)?.name : undefined;
  const accountLabel = isTransfer && toName ? `${accountName ?? ''} -> ${toName}` : accountName;

  const sign = isTransfer ? '' : isAdjustment ? (adjustsUp ? '+' : '-') : isIncome ? '+' : '-';
  const amountText = `${sign}${formatIDR(item.amount)}`;

  const subtitle = [accountLabel, item.note].filter(Boolean).join(' - ');

  return (
    <View
      style={styles.row}
      accessible={false}
      accessibilityLabel={`${title}, ${amountText}, ${formatDate(item.date)}`}
    >
      <View style={styles.iconWrap}>
        <Icon size={18} color={tone.fg} />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.category} numberOfLines={1}>
            {title}
          </Text>
          {isAdjustment ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('common.notCounted')}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.meta} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount} numberOfLines={1}>
          {amountText}
        </Text>
        {onPress || onDelete ? (
          <View style={styles.actionsRow}>
            {onPress ? (
              <Pressable
                onPress={() => onPress(item.id)}
                hitSlop={6}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`${t('input.headingEdit')}: ${title}`}
              >
                <Pencil size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={() => onDelete(item.id)}
                hitSlop={6}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`${t('common.delete')}: ${title}`}
              >
                <Trash2 size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const TransactionItem = memo(TransactionItemImpl);
export default TransactionItem;
