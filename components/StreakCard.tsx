import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, shadow } from '../constants/theme';
import { useT } from '../i18n';

interface Props {
  current: number;
  longest: number;
}

export default function StreakCard({ current, longest }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      ...shadow.card,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.warning + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    main: { flex: 1 },
    big: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary, lineHeight: 30 },
    label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
    sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  }), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Flame size={24} color={colors.warning} />
      </View>
      <View style={styles.main}>
        <Text style={styles.big}>{current}<Text style={styles.label}>{t('streak.dayStreak')}</Text></Text>
        <Text style={styles.sub}>{longest === 1 ? t('streak.longestOne', { n: longest }) : t('streak.longestMany', { n: longest })}</Text>
      </View>
    </View>
  );
}
