import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  action?: { label: string; onPress: () => void };
}

export default function SectionHeader({ title, subtitle, Icon, action }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        main: { flex: 1 },
        title: {
          fontSize: fontSize.sm,
          fontWeight: weight.heavy,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
        subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        action: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.primary },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      {Icon ? <Icon size={16} color={colors.textMuted} /> : null}
      <View style={styles.main}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={12} accessibilityRole="button">
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
