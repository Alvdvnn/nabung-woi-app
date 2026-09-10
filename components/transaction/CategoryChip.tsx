import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, Icon, active, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.md,
          // 44pt tall: chips are the most-tapped control on the add form.
          minHeight: 44,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: weight.medium },
        labelActive: { color: colors.onPrimary, fontWeight: weight.bold },
      }),
    [colors],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon size={16} color={active ? colors.onPrimary : colors.textSecondary} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}
