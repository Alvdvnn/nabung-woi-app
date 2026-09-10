import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import Card from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useT } from '../../i18n';

interface Props {
  current: number;
  longest: number;
}

export default function StreakCard({ current, longest }: Props) {
  const { colors } = useTheme();
  const t = useT();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: radius.full,
          backgroundColor: colors.warningLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        main: { flex: 1 },
        big: { fontSize: fontSize.display, fontWeight: weight.black, color: colors.textPrimary, lineHeight: 38 },
        label: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: weight.bold },
        longest: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold, textAlign: 'right' },
        // The dots make the streak legible at a glance without reading numbers.
        pips: { flexDirection: 'row', gap: 3, marginTop: 6 },
        pip: { width: 6, height: 6, borderRadius: 3 },
      }),
    [colors],
  );

  const pips = useMemo(() => Array.from({ length: 7 }, (_, i) => i < Math.min(current, 7)), [current]);

  return (
    <Card padded={false} style={{ padding: spacing.md }}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Flame size={24} color={colors.warning} />
        </View>
        <View style={styles.main}>
          <Text style={styles.big}>
            {current}
            <Text style={styles.label}>{t('streak.dayStreak')}</Text>
          </Text>
          <View style={styles.pips}>
            {pips.map((filled, i) => (
              <View
                key={i}
                style={[styles.pip, { backgroundColor: filled ? colors.warning : colors.border }]}
              />
            ))}
          </View>
        </View>
        <Text style={styles.longest}>
          {longest === 1 ? t('streak.longestOne', { n: longest }) : t('streak.longestMany', { n: longest })}
        </Text>
      </View>
    </Card>
  );
}
