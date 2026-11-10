import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Switch from '../ui/Switch';
import MonthGrid from '../calendar/MonthGrid';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';
import { addDays, isSameDay, moveToDay, startOfDay } from '../../utils/date';
import { formatDateLong, formatTime } from '../../utils/format';

interface Props {
  visible: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
  /** Show the optional time controls. Off for "move to date" style pickers. */
  withTime?: boolean;
  /** Disallow future days. */
  noFuture?: boolean;
  title?: string;
}

/**
 * Custom date picker: identical on iOS, Android, and web. Month grid, Today /
 * Yesterday chips, and an optional time. Confirming applies the whole value
 * at once so a half-picked date never leaks into the form.
 */
export default function DateSheet({ visible, value, onChange, onClose, withTime = true, noFuture = true, title }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [draft, setDraft] = useState<Date>(value);
  const [month, setMonth] = useState<Date>(value);
  const [timeOn, setTimeOn] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    setMonth(value);
    // A value that is not at midnight was picked with a time before.
    setTimeOn(value.getHours() !== 0 || value.getMinutes() !== 0);
  }, [visible, value]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
        timeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.sm,
        },
        timeLabel: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.textPrimary },
        steppers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
        stepper: { alignItems: 'center', gap: spacing.xs },
        stepBtn: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        stepValue: { fontSize: fontSize.display, fontWeight: weight.black, color: colors.textPrimary, minWidth: 64, textAlign: 'center' },
        colon: { fontSize: fontSize.display, fontWeight: weight.black, color: colors.textMuted, marginTop: 44 },
        preview: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
      }),
    [colors],
  );

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);

  const pickDay = (d: Date) => {
    setDraft((prev) => moveToDay(prev, d));
    setMonth(d);
  };

  const bump = (unit: 'h' | 'm', delta: number) => {
    setDraft((prev) => {
      const next = new Date(prev);
      if (unit === 'h') next.setHours((prev.getHours() + delta + 24) % 24);
      else next.setMinutes((prev.getMinutes() + delta + 60) % 60);
      return next;
    });
  };

  const confirm = () => {
    const out = new Date(draft);
    if (!timeOn) out.setHours(0, 0, 0, 0);
    onChange(out);
    onClose();
  };

  const hh = String(draft.getHours()).padStart(2, '0');
  const mm = String(draft.getMinutes()).padStart(2, '0');

  return (
    <Sheet
      visible={visible}
      title={title ?? t('date.pick')}
      onClose={onClose}
      scroll
      footer={<Button label={t('common.done')} onPress={confirm} size="lg" />}
    >
      <View style={{ gap: spacing.md }}>
        <View style={styles.chips}>
          <Chip label={t('period.today')} selected={isSameDay(draft, today)} onPress={() => pickDay(today)} size="sm" />
          <Chip label={t('date.yesterday')} selected={isSameDay(draft, yesterday)} onPress={() => pickDay(yesterday)} size="sm" />
        </View>

        <MonthGrid
          month={month}
          selected={draft}
          onSelectDate={pickDay}
          onChangeMonth={setMonth}
          maxDate={noFuture ? today : undefined}
          dense
        />

        {withTime ? (
          <>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>{t('date.setTime')}</Text>
              <Switch value={timeOn} onValueChange={setTimeOn} accessibilityLabel={t('date.setTime')} />
            </View>
            {timeOn ? (
              <View style={styles.steppers}>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => bump('h', 1)} accessibilityRole="button" accessibilityLabel={t('date.hourUp')}>
                    <Plus size={18} color={colors.textSecondary} />
                  </Pressable>
                  <Text style={styles.stepValue}>{hh}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => bump('h', -1)} accessibilityRole="button" accessibilityLabel={t('date.hourDown')}>
                    <Minus size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Text style={styles.colon}>:</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => bump('m', 5)} accessibilityRole="button" accessibilityLabel={t('date.minuteUp')}>
                    <Plus size={18} color={colors.textSecondary} />
                  </Pressable>
                  <Text style={styles.stepValue}>{mm}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => bump('m', -5)} accessibilityRole="button" accessibilityLabel={t('date.minuteDown')}>
                    <Minus size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.preview}>
          {timeOn && withTime
            ? `${formatDateLong(draft.toISOString())} · ${formatTime(draft.toISOString())}`
            : formatDateLong(draft.toISOString())}
        </Text>
      </View>
    </Sheet>
  );
}
