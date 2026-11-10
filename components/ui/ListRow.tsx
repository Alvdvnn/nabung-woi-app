import { ReactNode, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Check, ChevronRight, LucideIcon } from 'lucide-react-native';
import IconBadge from './IconBadge';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  iconTint?: string;
  iconBg?: string;
  /** Right-aligned text, e.g. a balance or a current setting. */
  value?: string;
  valueColor?: string;
  /** `chevron` for navigation, `check` when selected, or any element (a Switch). */
  trailing?: 'chevron' | 'check' | ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Danger rows (delete, clear) render the title in the expense color. */
  tone?: 'default' | 'danger';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * One row for every list in Settings, pickers, and filters: icon badge,
 * title + subtitle, optional value, optional trailing control. 56pt tall so
 * the whole row is a comfortable target.
 */
export default function ListRow({
  title,
  subtitle,
  Icon,
  iconTint,
  iconBg,
  value,
  valueColor,
  trailing,
  onPress,
  onLongPress,
  selected = false,
  disabled = false,
  tone = 'default',
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 56,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        },
        pressed: { backgroundColor: colors.surfaceSunken },
        main: { flex: 1, gap: 2 },
        title: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.textPrimary },
        titleDanger: { color: colors.expense },
        subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
        value: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textSecondary, maxWidth: '45%' },
        disabled: { opacity: 0.5 },
      }),
    [colors],
  );

  const trailingNode =
    trailing === 'chevron' ? (
      <ChevronRight size={18} color={colors.textMuted} />
    ) : trailing === 'check' ? (
      selected ? <Check size={18} color={colors.primary} /> : <View style={{ width: 18 }} />
    ) : (
      trailing ?? null
    );

  const body = (
    <>
      {Icon ? (
        <IconBadge
          Icon={Icon}
          size={38}
          tint={iconTint ?? (tone === 'danger' ? colors.expense : undefined)}
          bg={iconBg ?? (tone === 'danger' ? colors.expenseLight : undefined)}
        />
      ) : null}
      <View style={styles.main}>
        <Text style={[styles.title, tone === 'danger' && styles.titleDanger]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.value, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailingNode}
    </>
  );

  if (!onPress && !onLongPress) {
    return <View style={[styles.row, disabled && styles.disabled, style]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      {body}
    </Pressable>
  );
}
