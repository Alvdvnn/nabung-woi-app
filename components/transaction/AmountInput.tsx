import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { groupDigits } from '../../utils/format';

interface Props {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  /** Accent color, so the field matches the selected transaction type. */
  accent?: string;
  label?: string;
}

// Denominations that cover most day-to-day Indonesian cash amounts.
const QUICK_AMOUNTS = [10_000, 50_000, 100_000];

export default function AmountInput({ value, onChange, autoFocus = true, accent, label }: Props) {
  const { colors } = useTheme();
  const tint = accent ?? colors.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: tint,
          paddingVertical: spacing.sm,
        },
        currency: {
          fontSize: fontSize.xxl,
          fontWeight: weight.bold,
          color: tint,
          marginRight: spacing.sm,
        },
        input: {
          flex: 1,
          fontSize: fontSize.display,
          fontWeight: weight.heavy,
          color: colors.textPrimary,
          padding: 0,
        },
        quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
        chip: {
          flex: 1,
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textSecondary },
        clear: { paddingHorizontal: spacing.sm, minHeight: 40, justifyContent: 'center' },
        clearText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textMuted },
      }),
    [colors, tint],
  );

  const current = Number(value) || 0;

  return (
    <View>
      <View style={styles.wrap}>
        <Text style={styles.currency}>Rp</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={groupDigits(value)}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
          autoFocus={autoFocus}
          accessibilityLabel={label}
        />
      </View>

      {/* Stepper chips: fastest path to the amounts people actually type. */}
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((q) => (
          <Pressable
            key={q}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel={`+${groupDigits(q)}`}
            onPress={() => onChange(String(current + q))}
          >
            <Text style={styles.chipText}>{`+${groupDigits(q)}`}</Text>
          </Pressable>
        ))}
        {current > 0 ? (
          <Pressable style={styles.clear} accessibilityRole="button" onPress={() => onChange('')}>
            <Text style={styles.clearText}>C</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
