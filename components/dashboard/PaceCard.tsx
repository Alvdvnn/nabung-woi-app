import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gauge } from 'lucide-react-native';
import Card from '../ui/Card';
import IconBadge from '../ui/IconBadge';
import ProgressBar from '../ui/ProgressBar';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { formatIDRCompact } from '../../utils/format';
import type { Pace } from '../../utils/report';
import { useT } from '../../i18n';

interface Props {
  pace: Pace;
  /** Last period's expense, for "at this pace you'll end above/below last time". */
  previousExpense: number;
}

/** "Spent X in N days; about Y by the end at this pace." */
export default function PaceCard({ pace, previousExpense }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        main: { flex: 1, gap: 2 },
        title: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textSecondary },
        value: { fontSize: fontSize.lg, fontWeight: weight.black, color: colors.textPrimary, letterSpacing: -0.3 },
        body: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 19, marginTop: spacing.sm },
        meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
        metaText: { fontSize: fontSize.xs, color: colors.textMuted },
      }),
    [colors],
  );

  const progress = pace.daysElapsed / pace.daysInRange;
  const vsPrev =
    previousExpense > 0
      ? pace.projected > previousExpense
        ? t('pace.abovePrev', { n: formatIDRCompact(pace.projected - previousExpense) })
        : t('pace.belowPrev', { n: formatIDRCompact(previousExpense - pace.projected) })
      : '';

  return (
    <Card>
      <View style={styles.row}>
        <IconBadge Icon={Gauge} size={40} tint={colors.warning} bg={colors.warningLight} />
        <View style={styles.main}>
          <Text style={styles.title}>{t('pace.title')}</Text>
          <Text style={styles.value} numberOfLines={2}>
            {t('pace.projected', { n: formatIDRCompact(pace.projected) })}
          </Text>
        </View>
      </View>
      <Text style={styles.body}>
        {t('pace.body', { spent: formatIDRCompact(pace.spent), days: pace.daysElapsed, perDay: formatIDRCompact(pace.perDay) })}
        {vsPrev ? ` ${vsPrev}` : ''}
      </Text>
      <ProgressBar value={progress} color={colors.warning} style={{ marginTop: spacing.md }} />
      <View style={styles.meta}>
        <Text style={styles.metaText}>{t('pace.dayOf', { d: pace.daysElapsed, n: pace.daysInRange })}</Text>
        <Text style={styles.metaText}>{t('pace.daysLeft', { n: pace.daysInRange - pace.daysElapsed })}</Text>
      </View>
    </Card>
  );
}
