import { useMemo, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  Icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Heights keep every button at or above the 44pt minimum touch target.
const HEIGHTS: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 54 };

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  Icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: Props) {
  const { colors } = useTheme();

  const palette = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return { bg: colors.surface, fg: colors.textPrimary, border: colors.borderStrong };
      case 'ghost':
        return { bg: 'transparent', fg: colors.primary, border: 'transparent' };
      case 'danger':
        return { bg: colors.expense, fg: colors.white, border: colors.expense };
      case 'primary':
      default:
        return { bg: colors.primary, fg: colors.onPrimary, border: colors.primary };
    }
  }, [variant, colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          height: HEIGHTS[size],
          paddingHorizontal: size === 'sm' ? spacing.lg : spacing.xl,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        full: { alignSelf: 'stretch', flex: 1 },
        label: {
          color: palette.fg,
          fontSize: size === 'sm' ? fontSize.sm : fontSize.md,
          fontWeight: weight.bold,
        },
        disabled: { opacity: 0.5 },
      }),
    [palette, size],
  );

  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.full,
        inactive && styles.disabled,
        pressed && !inactive && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={palette.fg} /> : null}
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: spacing.sm }}>{children}</View>;
}
