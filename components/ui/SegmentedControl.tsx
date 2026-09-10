import { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export interface Segment<T extends string> {
  id: T;
  label: string;
  Icon?: LucideIcon;
  /** Overrides the active pill color - used by the income/expense toggle. */
  activeColor?: string;
}

interface Props<T extends string> {
  options: readonly Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Tightens padding and type for rows of four or more segments. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * One control for every "pick one of N" row in the app: period, transaction
 * type, filters, appearance, language. Replaces four near-identical toggles.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
  style,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSunken,
          borderRadius: radius.full,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.border,
        },
        btn: {
          flex: 1,
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 4 : 6,
          paddingHorizontal: compact ? spacing.xs : spacing.sm,
          borderRadius: radius.full,
        },
        label: {
          fontSize: compact ? fontSize.xs : fontSize.sm,
          fontWeight: weight.semibold,
          color: colors.textSecondary,
        },
        labelActive: { color: colors.white, fontWeight: weight.bold },
      }),
    [colors, compact],
  );

  return (
    <View style={[styles.wrap, style]}>
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
              styles.btn,
              active && { backgroundColor: activeBg },
              pressed && !active && { backgroundColor: colors.border },
            ]}
          >
            {opt.Icon ? <opt.Icon size={compact ? 14 : 16} color={fg} /> : null}
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
