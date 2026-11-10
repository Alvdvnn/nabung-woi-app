import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import ProgressBar from '../ui/ProgressBar';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { CategoryDef } from '../../constants/categories';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { usePrefs } from '../../context/PrefsContext';
import { formatIDR, formatIDRCompact, groupDigits } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  visible: boolean;
  category: CategoryDef | null;
  /** Spent this month, for the preview bar. */
  spent: number;
  onClose: () => void;
}

const QUICK = [500_000, 1_000_000, 2_000_000, 5_000_000];

export default function BudgetSheet({ visible, category, spent, onClose }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { budgetsByCategory, setBudget } = usePrefs();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !category) return;
    const current = budgetsByCategory.get(category.id);
    setAmount(current ? String(current) : '');
    setSaving(false);
  }, [visible, category, budgetsByCategory]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { fontSize: fontSize.xs, fontWeight: weight.heavy, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
        wrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          minHeight: 60,
        },
        currency: { fontSize: fontSize.lg, fontWeight: weight.bold, color: colors.primary },
        input: { flex: 1, fontSize: fontSize.xxl, fontWeight: weight.heavy, color: colors.textPrimary, padding: 0 },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        preview: { gap: spacing.sm },
        previewText: { fontSize: fontSize.sm, color: colors.textSecondary },
      }),
    [colors],
  );

  const parsed = Number(amount) || 0;
  const existing = category ? budgetsByCategory.get(category.id) : undefined;

  async function save(value: number | null) {
    if (!category) return;
    setSaving(true);
    try {
      await setBudget(category.id, value);
      toast.show('success', value ? t('budget.saved') : t('budget.removed'));
      onClose();
    } catch {
      toast.show('error', t('input.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title={t('budget.title')}
      subtitle={category?.name}
      onClose={onClose}
      scroll
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {existing ? <Button label={t('budget.remove')} variant="secondary" onPress={() => save(null)} disabled={saving} fullWidth /> : null}
          <Button label={t('budget.set')} onPress={() => save(parsed)} loading={saving} disabled={parsed <= 0} fullWidth />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View>
          <Text style={styles.label}>{t('budget.monthly')}</Text>
          <View style={styles.wrap}>
            <Text style={styles.currency}>Rp</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              inputMode="numeric"
              value={groupDigits(amount)}
              onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, '').slice(0, 13))}
              accessibilityLabel={t('budget.monthly')}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.chips}>
          {QUICK.map((q) => (
            <Chip key={q} label={formatIDRCompact(q)} size="sm" selected={parsed === q} onPress={() => setAmount(String(q))} />
          ))}
        </View>

        {parsed > 0 ? (
          <View style={styles.preview}>
            <ProgressBar value={spent / parsed} />
            <Text style={styles.previewText}>
              {t('budget.spentOf', { spent: formatIDR(spent), budget: formatIDR(parsed) })}
            </Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
