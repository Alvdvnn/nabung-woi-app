import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { isoDay } from '../utils/format';
import { useLocale } from '../i18n';
import { DICTS } from '../i18n/dicts';

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
  const DOW = DICTS[locale].calendar.dow;
  const MONTH_NAMES = DICTS[locale].calendar.months;
  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    navBtn: {
      width: 32, height: 32, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    monthLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
    dowRow: { flexDirection: 'row', marginBottom: spacing.xs },
    dow: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inner: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    innerToday: { borderWidth: 1.5, borderColor: colors.primaryLight },
    innerSelected: { backgroundColor: colors.primary },
    dayNum: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '500' },
    dayNumSelected: { color: colors.white, fontWeight: '700' },
    dot: {
      position: 'absolute',
      bottom: 3,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    dotOnSelected: { backgroundColor: colors.white },
  }), [colors]);

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIdx, d));

  const today = isoDay(new Date());
  const selectedIso = isoDay(selected);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeMonth(new Date(year, monthIdx - 1, 1))}
          hitSlop={8}
          style={styles.navBtn}
        >
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthLabel}>{MONTH_NAMES[monthIdx]} {year}</Text>
        <Pressable
          onPress={() => onChangeMonth(new Date(year, monthIdx + 1, 1))}
          hitSlop={8}
          style={styles.navBtn}
        >
          <ChevronRight size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.dowRow}>
        {DOW.map((d) => (
          <Text key={d} style={styles.dow}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const iso = isoDay(d);
          const isToday = iso === today;
          const isSelected = iso === selectedIso;
          const hasTx = txDates.has(iso);
          return (
            <Pressable
              key={iso}
              style={styles.cell}
              onPress={() => onSelectDate(d)}
              hitSlop={2}
            >
              <View style={[
                styles.inner,
                isSelected && styles.innerSelected,
                isToday && !isSelected && styles.innerToday,
              ]}>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{d.getDate()}</Text>
                {hasTx && <View style={[styles.dot, isSelected && styles.dotOnSelected]} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
