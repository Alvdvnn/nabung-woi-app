import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../ui/Card';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Totals } from '../../utils/aggregate';
import { formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  totals: Totals;
  /** Days in the month with at least one entry. */
  daysLogged: number;
  daysInMonth: number;
}

/** Income / expense / net for the visible month, above the grid. */
export default function MonthSummary({ totals, daysLogged, daysInMonth }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', gap: spacing.md },
        cell: { flex: 1, gap: 2 },
        label: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold, textTransform: 'uppercase', letterSpacing: 0.4 },
        value: { fontSize: fontSize.md, fontWeight: weight.heavy },
        meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
      }),
    [colors],
  );
  return (
    <Card padded={false} style={{ padding: spacing.md }}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('type.income')}</Text>
          <Text style={[styles.value, { color: colors.income }]} numberOfLines={1}>
            {formatIDRCompact(totals.income)}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('type.expense')}</Text>
          <Text style={[styles.value, { color: colors.expense }]} numberOfLines={1}>
            {formatIDRCompact(totals.expense)}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('dashboard.cashflow')}</Text>
          <Text style={[styles.value, { color: totals.net >= 0 ? colors.income : colors.expense }]} numberOfLines={1}>
            {`${totals.net >= 0 ? '+' : '-'}${formatIDRCompact(Math.abs(totals.net))}`}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>{t('calendar.daysLogged', { n: daysLogged, total: daysInMonth })}</Text>
    </Card>
  );
}
