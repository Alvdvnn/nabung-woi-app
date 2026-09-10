import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export interface FilterOption<T extends string> {
  id: T;
  label: string;
  Icon?: LucideIcon;
  /** Color of the selected chip; defaults to the brand color. */
  activeColor?: string;
}

interface Props<T extends string> {
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (id: T) => void;
}

/**
 * Wrapping chip row for choices that do not fit a segmented control.
 *
 * Past four options a segmented control squeezes each label below its own
 * width and truncates it; chips wrap to a second line and keep full labels at
 * a 44pt touch height.
 */
export default function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        label: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textSecondary },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.id === value;
        const activeBg = opt.activeColor ?? colors.primary;
        const fg = active ? colors.white : colors.textSecondary;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => [
              styles.chip,
              active && { backgroundColor: activeBg, borderColor: activeBg },
              pressed && !active && { backgroundColor: colors.surfaceSunken },
            ]}
          >
            {opt.Icon ? <opt.Icon size={14} color={fg} /> : null}
            <Text style={[styles.label, { color: fg }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
