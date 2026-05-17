import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, Icon, active, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
    labelActive: { color: colors.white, fontWeight: '600' },
  }), [colors]);

  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Icon size={16} color={active ? colors.white : colors.textSecondary} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}
