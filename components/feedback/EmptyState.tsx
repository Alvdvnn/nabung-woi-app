import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import Button from '../ui/Button';

interface Props {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Gives the empty state somewhere to go instead of being a dead end. */
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ Icon, title, subtitle, action }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.sm },
        iconWrap: {
          width: 72,
          height: 72,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        title: { fontSize: fontSize.lg, fontWeight: weight.bold, color: colors.textPrimary, textAlign: 'center' },
        subtitle: {
          fontSize: fontSize.sm,
          color: colors.textMuted,
          textAlign: 'center',
          maxWidth: 260,
          lineHeight: 20,
        },
        action: { marginTop: spacing.md },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}
