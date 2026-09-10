import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useLocale, useT } from '../../i18n';
import { DICTS } from '../../i18n/dicts';
import { DateRange, isCurrentRange } from '../../utils/period';
import { formatDate, formatDayMonth } from '../../utils/format';

interface Props {
  range: DateRange;
  onShift: (dir: 1 | -1) => void;
  /** Optional tap on the label, e.g. to jump back to today. */
  onPressLabel?: () => void;
}

/** Human label for a range, in the active locale. */
export function useRangeLabel(range: DateRange): string {
  const { locale } = useLocale();
  return useMemo(() => {
    const months = DICTS[locale].calendar.months;
    switch (range.granularity) {
      case 'day':
        return formatDate(range.start.toISOString());
      case 'week':
        return `${formatDayMonth(range.start.toISOString())} - ${formatDate(range.end.toISOString())}`;
      case 'year':
        return String(range.start.getFullYear());
      case 'month':
      default:
        return `${months[range.start.getMonth()]} ${range.start.getFullYear()}`;
    }
  }, [range, locale]);
}

export default function RangeNav({ range, onShift, onPressLabel }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const label = useRangeLabel(range);
  // Nothing is recorded in the future, so stepping past the current period is
  // disabled rather than silently showing an empty screen.
  const atLatest = isCurrentRange(range);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.xs,
        },
        btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
        label: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
        labelText: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
      }),
    [colors],
  );

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => onShift(-1)}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={t('period.previous')}
      >
        <ChevronLeft size={20} color={colors.textSecondary} />
      </Pressable>

      <Pressable style={styles.label} onPress={onPressLabel} disabled={!onPressLabel}>
        <Text style={styles.labelText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onShift(1)}
        style={styles.btn}
        disabled={atLatest}
        accessibilityRole="button"
        accessibilityLabel={t('period.next')}
        accessibilityState={{ disabled: atLatest }}
      >
        <ChevronRight size={20} color={atLatest ? colors.border : colors.textSecondary} />
      </Pressable>
    </View>
  );
}
