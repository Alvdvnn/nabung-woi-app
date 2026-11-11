import { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LucideIcon, X } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { inkOn } from '../../utils/contrast';

interface Props {
  label: string;
  Icon?: LucideIcon;
  selected?: boolean;
  /** Fill color when selected; defaults to primary. */
  color?: string;
  onPress?: () => void;
  /** Shows an X and makes the chip removable (active filter chips). */
  onRemove?: () => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill chip. Selectable (filters, quick amounts) or removable (active filter
 * summary). Always at least 36pt tall with hitSlop up to 44.
 */
export default function Chip({ label, Icon, selected = false, color, onPress, onRemove, size = 'md', style }: Props) {
  const { colors } = useTheme();
  const fill = color ?? colors.primary;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: size === 'sm' ? 36 : 44,
          paddingLeft: spacing.md,
          paddingRight: onRemove ? spacing.xs : spacing.md,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        label: { fontSize: size === 'sm' ? fontSize.xs : fontSize.sm, fontWeight: weight.semibold, color: colors.textSecondary },
        remove: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
      }),
    [colors, size, onRemove],
  );
  // `fill` may be any accent passed by the caller, not just primary.
  const fg = selected ? inkOn(colors, fill) : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress ?? onRemove}
      hitSlop={size === 'sm' ? 4 : 0}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: fill, borderColor: fill },
        pressed && !selected && { backgroundColor: colors.surfaceSunken },
        style,
      ]}
    >
      {Icon ? <Icon size={14} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove ? (
        <View style={styles.remove}>
          <X size={14} color={fg} />
        </View>
      ) : null}
    </Pressable>
  );
}
