import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calculator as CalculatorIcon, X } from 'lucide-react-native';
import Chip from '../ui/Chip';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useCalculator } from '../../hooks/useCalculator';
import { formatIDRCompact, groupDigits } from '../../utils/format';
import { hapticSelection } from '../../utils/haptics';
import { useT } from '../../i18n';

interface Props {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  /** Accent color, so the field matches the selected transaction type. */
  accent?: string;
  label?: string;
}

// Each chip ADDS to the amount. Denominations that cover day-to-day cash.
const QUICK_AMOUNTS = [10_000, 20_000, 50_000, 100_000];

/** The hero of the form: a big type-colored amount with quick-add chips. */
export default function AmountInput({ value, onChange, autoFocus = true, accent, label }: Props) {
  const { colors } = useTheme();
  const calc = useCalculator();
  const t = useT();
  const tint = accent ?? colors.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.md,
        },
        wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        currency: { fontSize: fontSize.xl, fontWeight: weight.bold, color: tint },
        input: {
          flex: 1,
          fontSize: fontSize.hero,
          lineHeight: 50,
          fontWeight: weight.black,
          color: colors.textPrimary,
          padding: 0,
          letterSpacing: -1,
          minWidth: 0,
        },
        iconBtn: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken },
        quickRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
      }),
    [colors, tint],
  );

  const current = Number(value) || 0;

  return (
    <View style={styles.card}>
      <View style={styles.wrap}>
        <Text style={styles.currency}>Rp</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          inputMode="numeric"
          value={groupDigits(value)}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, '').slice(0, 15))}
          autoFocus={autoFocus}
          accessibilityLabel={label}
          numberOfLines={1}
        />
        {current > 0 ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel={t('input.clearAmount')}
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
        <Pressable
          style={styles.iconBtn}
          onPress={() => calc.open({ onApply: (n) => onChange(String(n)) })}
          accessibilityRole="button"
          accessibilityLabel={t('calc.title')}
        >
          <CalculatorIcon size={18} color={tint} />
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((q) => (
          <Chip
            key={q}
            label={`+${formatIDRCompact(q).replace('Rp ', '')}`}
            size="sm"
            onPress={() => {
              hapticSelection();
              onChange(String(current + q));
            }}
          />
        ))}
      </View>
    </View>
  );
}
