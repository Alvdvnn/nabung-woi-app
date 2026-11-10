import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { getWeekStart, isoDay } from '../../utils/date';
import { formatDate } from '../../utils/format';
import { useLocale, useT } from '../../i18n';
import { DICTS } from '../../i18n/dicts';

/** Per-day decoration the caller computes (markers, heat, net label). */
export interface DayDecor {
  dot?: boolean;
  /** 0 (none) to 4 (strongest) expense intensity; tints the cell. */
  heat?: 0 | 1 | 2 | 3 | 4;
  /** Income-only day: soft income tint instead of heat. */
  income?: boolean;
  /** Tiny label under the number, e.g. "-25rb". */
  label?: string;
  labelColor?: string;
}

interface Props {
  month: Date;
  selected?: Date | null;
  onSelectDate: (d: Date) => void;
  onChangeMonth?: (d: Date) => void;
  decorate?: (iso: string) => DayDecor | undefined;
  /** Days after this are disabled (e.g. no future dates in the form). */
  maxDate?: Date;
  /** Larger cells with room for a label (Calendar tab); compact for sheets. */
  dense?: boolean;
}

/**
 * Month grid shared by the Calendar tab and the date sheet. Honors the
 * week-start preference, marks today, and lets the caller decorate days.
 */
export default function MonthGrid({
  month,
  selected,
  onSelectDate,
  onChangeMonth,
  decorate,
  maxDate,
  dense = false,
}: Props) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const t = useT();
  const weekStart = getWeekStart();
  const dict = DICTS[locale].calendar;
  const dow = useMemo(
    () => (weekStart === 'mon' ? [...dict.dow.slice(1), dict.dow[0]] : dict.dow),
    [dict.dow, weekStart],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        navBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
        monthLabel: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        dowRow: { flexDirection: 'row', marginBottom: spacing.xs },
        dow: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold },
        grid: { flexDirection: 'row', flexWrap: 'wrap' },
        cell: { width: `${100 / 7}%`, aspectRatio: dense ? 1 : 0.86, alignItems: 'center', justifyContent: 'center', padding: 2 },
        inner: {
          width: '100%',
          height: '100%',
          minWidth: 36,
          minHeight: 36,
          borderRadius: radius.sm + 2,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        },
        innerToday: { borderWidth: 1.5, borderColor: colors.primary },
        innerSelected: { backgroundColor: colors.primary },
        dayNum: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: weight.medium },
        dayNumSelected: { color: colors.onPrimary, fontWeight: weight.bold },
        dayNumDisabled: { color: colors.textMuted, opacity: 0.5 },
        label: { fontSize: 9, fontWeight: weight.bold, lineHeight: 11 },
        dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 1 },
        dotOnSelected: { backgroundColor: colors.onPrimary },
      }),
    [colors, dense],
  );

  const year = month.getFullYear();
  const monthIdx = month.getMonth();

  const cells = useMemo(() => {
    const firstDow = new Date(year, monthIdx, 1).getDay(); // 0 = Sunday
    const lead = weekStart === 'mon' ? (firstDow + 6) % 7 : firstDow;
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, monthIdx, d));
    return out;
  }, [year, monthIdx, weekStart]);

  const today = isoDay(new Date());
  const selectedIso = selected ? isoDay(selected) : '';
  const maxIso = maxDate ? isoDay(maxDate) : null;

  // Heat tints: light expense tint growing to the solid expense color at 4.
  const heatBg = (heat: number) => {
    if (heat <= 0) return undefined;
    const alpha = ['00', '33', '66', '99', 'cc'][heat] ?? 'cc';
    return `${colors.expense}${alpha}`;
  };

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeMonth?.(new Date(year, monthIdx - 1, 1))}
          disabled={!onChangeMonth}
          style={({ pressed }) => [styles.navBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
          accessibilityRole="button"
          accessibilityLabel={t('period.previous')}
        >
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthLabel} accessibilityRole="header">
          {`${dict.months[monthIdx]} ${year}`}
        </Text>
        <Pressable
          onPress={() => onChangeMonth?.(new Date(year, monthIdx + 1, 1))}
          disabled={!onChangeMonth}
          style={({ pressed }) => [styles.navBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
          accessibilityRole="button"
          accessibilityLabel={t('period.next')}
        >
          <ChevronRight size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.dowRow}>
        {dow.map((d) => (
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
          const disabled = maxIso !== null && iso > maxIso;
          const decor = decorate?.(iso);
          const heat = decor?.heat ?? 0;
          const bg = isSelected
            ? undefined
            : heat > 0
              ? heatBg(heat)
              : decor?.income
                ? `${colors.income}33`
                : undefined;
          return (
            <Pressable
              key={iso}
              style={styles.cell}
              onPress={() => onSelectDate(d)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={`${formatDate(d.toISOString())}${decor?.label ? `, ${decor.label}` : ''}`}
            >
              <View
                style={[
                  styles.inner,
                  bg ? { backgroundColor: bg } : null,
                  isSelected && styles.innerSelected,
                  isToday && !isSelected && styles.innerToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    isToday && !isSelected && { fontWeight: weight.bold, color: colors.primary },
                    heat >= 3 && !isSelected && { color: colors.white },
                    isSelected && styles.dayNumSelected,
                    disabled && styles.dayNumDisabled,
                  ]}
                >
                  {d.getDate()}
                </Text>
                {decor?.label && !dense ? (
                  <Text
                    style={[
                      styles.label,
                      { color: isSelected ? colors.onPrimary : heat >= 3 ? colors.white : (decor.labelColor ?? colors.textMuted) },
                    ]}
                    numberOfLines={1}
                  >
                    {decor.label}
                  </Text>
                ) : decor?.dot ? (
                  <View style={[styles.dot, isSelected && styles.dotOnSelected]} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
