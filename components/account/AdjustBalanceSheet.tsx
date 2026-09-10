import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Minus, Plus, Info } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../context/DataContext';
import { useT } from '../../i18n';
import { Account, AdjustmentDirection } from '../../utils/storage';
import { formatIDR, groupDigits } from '../../utils/format';
import { isoDay } from '../../utils/date';
import { genId } from '../../utils/id';

interface Props {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
}

const QUICK_AMOUNTS = [10_000, 50_000, 100_000];

/**
 * Two-tap balance correction.
 *
 * Writes an `adjustment` transaction: it moves the account balance and nothing
 * else — never income, never expense, never a category. That keeps the running
 * balance honest without polluting the numbers the user actually budgets by.
 */
export default function AdjustBalanceSheet({ visible, account, onClose }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const toast = useToast();
  const { addTx, balances } = useData();

  const [direction, setDirection] = useState<AdjustmentDirection>('out');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset whenever the sheet opens so a previous entry never leaks into the next.
  useEffect(() => {
    if (!visible) return;
    setDirection('out');
    setAmount('');
    setNote('');
    setSaving(false);
  }, [visible]);

  const current = account ? balances.get(account.id) ?? account.startingBalance : 0;
  const parsed = Number(amount) || 0;
  const preview = direction === 'in' ? current + parsed : current - parsed;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        balanceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surfaceSunken,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        },
        balanceCell: { gap: 2 },
        balanceLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold },
        balanceValue: { fontSize: fontSize.md, fontWeight: weight.heavy, color: colors.textPrimary },
        previewValue: { fontSize: fontSize.md, fontWeight: weight.heavy },
        dirRow: { flexDirection: 'row', gap: spacing.sm },
        dirBtn: {
          flex: 1,
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        dirLabel: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textSecondary },
        amountWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderBottomWidth: 2,
          borderBottomColor: colors.primary,
          paddingVertical: spacing.sm,
        },
        currency: { fontSize: fontSize.xl, fontWeight: weight.bold, color: colors.primary },
        amountInput: {
          flex: 1,
          fontSize: fontSize.display,
          fontWeight: weight.heavy,
          color: colors.textPrimary,
          padding: 0,
        },
        quickRow: { flexDirection: 'row', gap: spacing.sm },
        quickChip: {
          flex: 1,
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        quickText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textSecondary },
        label: {
          fontSize: fontSize.xs,
          fontWeight: weight.bold,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        noteInput: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          fontSize: fontSize.md,
          color: colors.textPrimary,
          minHeight: 48,
        },
        hint: {
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'flex-start',
          backgroundColor: colors.adjustmentLight,
          borderRadius: radius.md,
          padding: spacing.md,
        },
        hintText: { flex: 1, fontSize: fontSize.xs, color: colors.adjustment, lineHeight: 17 },
      }),
    [colors],
  );

  async function save() {
    if (!account) {
      toast.show('error', t('adjust.errAccount'));
      return;
    }
    if (parsed <= 0) {
      toast.show('error', t('adjust.errAmount'));
      return;
    }
    setSaving(true);
    const now = new Date();
    try {
      await addTx({
        id: genId('t'),
        type: 'adjustment',
        direction,
        amount: parsed,
        categoryId: 'adjustment',
        accountId: account.id,
        note: note.trim(),
        date: now.toISOString(),
        dayKey: isoDay(now),
      });
      toast.show('success', t('adjust.saved'));
      onClose();
    } catch {
      toast.show('error', t('adjust.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const decreaseActive = direction === 'out';

  return (
    <Sheet
      visible={visible}
      title={t('adjust.title')}
      subtitle={account?.name}
      onClose={onClose}
      scroll
    >
      <View style={{ gap: spacing.md }}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceCell}>
            <Text style={styles.balanceLabel}>{t('adjust.currentBalance')}</Text>
            <Text style={styles.balanceValue}>{formatIDR(current)}</Text>
          </View>
          <View style={[styles.balanceCell, { alignItems: 'flex-end' }]}>
            <Text style={styles.balanceLabel}>{t('adjust.newBalance')}</Text>
            <Text
              style={[
                styles.previewValue,
                { color: parsed === 0 ? colors.textMuted : decreaseActive ? colors.expense : colors.income },
              ]}
            >
              {formatIDR(preview)}
            </Text>
          </View>
        </View>

        <View style={styles.dirRow}>
          <Pressable
            onPress={() => setDirection('out')}
            accessibilityRole="button"
            accessibilityState={{ selected: decreaseActive }}
            style={[
              styles.dirBtn,
              decreaseActive && { borderColor: colors.expense, backgroundColor: colors.expenseLight },
            ]}
          >
            <Minus size={18} color={decreaseActive ? colors.expense : colors.textSecondary} />
            <Text style={[styles.dirLabel, decreaseActive && { color: colors.expense }]}>
              {t('adjust.decrease')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDirection('in')}
            accessibilityRole="button"
            accessibilityState={{ selected: !decreaseActive }}
            style={[
              styles.dirBtn,
              !decreaseActive && { borderColor: colors.income, backgroundColor: colors.incomeLight },
            ]}
          >
            <Plus size={18} color={!decreaseActive ? colors.income : colors.textSecondary} />
            <Text style={[styles.dirLabel, !decreaseActive && { color: colors.income }]}>
              {t('adjust.increase')}
            </Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.label}>{t('adjust.amount')}</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={groupDigits(amount)}
              onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
              accessibilityLabel={t('adjust.amount')}
            />
          </View>
        </View>

        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((q) => (
            <Pressable
              key={q}
              style={styles.quickChip}
              accessibilityRole="button"
              onPress={() => setAmount(String((Number(amount) || 0) + q))}
            >
              <Text style={styles.quickText}>{`+${groupDigits(q)}`}</Text>
            </Pressable>
          ))}
        </View>

        <View>
          <Text style={styles.label}>{t('adjust.note')}</Text>
          <TextInput
            style={styles.noteInput}
            placeholder={t('adjust.notePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={80}
          />
        </View>

        <View style={styles.hint}>
          <Info size={16} color={colors.adjustment} />
          <Text style={styles.hintText}>{t('adjust.excludedHint')}</Text>
        </View>

        <Button
          label={t('adjust.save')}
          onPress={save}
          loading={saving}
          disabled={parsed <= 0}
          size="lg"
        />
      </View>
    </Sheet>
  );
}
