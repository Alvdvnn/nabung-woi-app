import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { LayoutDashboard, LucideIcon } from 'lucide-react-native';
import { elevation, radius } from '../../constants/theme';
import { FAB_SIZE } from '../../constants/layout';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  onPress: () => void;
  Icon?: LucideIcon;
  variant?: 'primary' | 'light';
  bottom?: number;
  accessibilityLabel?: string;
}

export default function Fab({
  onPress,
  Icon = LayoutDashboard,
  variant = 'primary',
  bottom = 24,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: 'absolute',
          right: 24,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          ...elevation[3],
        },
        primary: { backgroundColor: colors.primary },
        light: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      }),
    [colors],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        { bottom },
        isPrimary ? styles.primary : styles.light,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={24} color={isPrimary ? colors.onPrimary : colors.primary} />
    </Pressable>
  );
}
