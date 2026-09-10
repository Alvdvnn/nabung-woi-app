import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Card from '../ui/Card';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { isoDay } from '../../utils/date';
import { formatDate } from '../../utils/format';
import { useLocale, useT } from '../../i18n';
import { DICTS } from '../../i18n/dicts';

interface Props {
  month: Date;
  selected: Date;
  txDates: Set<string>;
  onChangeMonth: (d: Date) => void;
  onSelectDate: (d: Date) => void;
}

export default function CalendarGrid({ month, selected, txDates, onChangeMonth, onSelectDate }: Props) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const t = useT();
  const DOW = DICTS[locale].calendar.dow;
  const MONTH_NAMES = DICTS[locale].calendar.months;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        navBtn: {
          width: 44,
          height: 44,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        monthLabel: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        dowRow: { flexDirection: 'row', marginBottom: spacing.xs },
        dow: {
          flex: 1,
          textAlign: 'center',
          fontSize: fontSize.xs,
          color: colors.textMuted,
          fontWeight: weight.semibold,
        },
        grid: { flexDirection: 'row', flexWrap: 'wrap' },
        cell: {
          width: `${100 / 7}%`,
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        inner: {
          width: 38,
          height: 38,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        innerToday: { borderWidth: 1.5, borderColor: colors.primary },
        innerSelected: { backgroundColor: colors.primary },
        dayNum: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: weight.medium },
        dayNumToday: { fontWeight: weight.bold },
        dayNumSelected: { color: colors.white, fontWeight: weight.bold },
        dot: {
          position: 'absolute',
          bottom: 4,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.primary,
        },
        dotOnSelected: { backgroundColor: colors.white },
      }),
    [colors],
  );

  const year = month.getFullYear();
  const monthIdx = month.getMonth();

  const cells = useMemo(() => {
    const firstDay = new Date(year, monthIdx, 1).getDay();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, monthIdx, d));
    return out;
  }, [year, monthIdx]);

  const today = isoDay(new Date());
  const selectedIso = isoDay(selected);

  return (
    <Card padded={false} style={{ padding: spacing.md }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeMonth(new Date(year, monthIdx - 1, 1))}
          style={({ pressed }) => [styles.navBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
          accessibilityRole="button"
          accessibilityLabel={t('period.previous')}
        >
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthLabel} accessibilityRole="header">
          {`${MONTH_NAMES[monthIdx]} ${year}`}
        </Text>
        <Pressable
          onPress={() => onChangeMonth(new Date(year, monthIdx + 1, 1))}
          style={({ pressed }) => [styles.navBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
          accessibilityRole="button"
          accessibilityLabel={t('period.next')}
        >
          <ChevronRight size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.dowRow}>
        {DOW.map((d) => (
          <Text key={d} style={styles.dow}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`pad-${i}`} style={styles.cell} />;
          const iso = isoDay(d);
          const isToday = iso === today;
          const isSelected = iso === selectedIso;
          const hasTx = txDates.has(iso);
          return (
            <Pressable
              key={iso}
              style={styles.cell}
              onPress={() => onSelectDate(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={formatDate(d.toISOString())}
            >
              <View
                style={[
                  styles.inner,
                  isSelected && styles.innerSelected,
                  isToday && !isSelected && styles.innerToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    isToday && !isSelected && styles.dayNumToday,
                    isSelected && styles.dayNumSelected,
                  ]}
                >
                  {d.getDate()}
                </Text>
                {hasTx ? <View style={[styles.dot, isSelected && styles.dotOnSelected]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
