import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { LayoutDashboard, Plus, LucideIcon } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onPress: () => void;
  Icon?: LucideIcon;
  variant?: 'primary' | 'light';
  bottom?: number;
}

export default function Fab({ onPress, Icon = LayoutDashboard, variant = 'primary', bottom = 24 }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const styles = useMemo(
    () => StyleSheet.create({
      fab: {
        position: 'absolute',
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
      primary: { backgroundColor: colors.primary },
      light: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    }),
    [colors]
  );
  return (
    <Pressable style={[styles.fab, { bottom }, isPrimary ? styles.primary : styles.light]} onPress={onPress}>
      <Icon size={24} color={isPrimary ? colors.white : colors.primary} />
    </Pressable>
  );
}

export { Plus };
