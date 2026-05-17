import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ Icon, title, subtitle }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
    subtitle: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', maxWidth: 240 },
  }), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
