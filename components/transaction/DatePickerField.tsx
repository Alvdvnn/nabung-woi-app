import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize, weight } from '../../constants/theme';
import { formatDate } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

export default function DatePickerField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: 52,
          borderWidth: 1,
          borderColor: colors.border,
        },
        text: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: weight.medium },
        sheet: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
        sheetCard: {
          backgroundColor: colors.surface,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        },
        sheetDone: {
          alignSelf: 'flex-end',
          paddingHorizontal: spacing.lg,
          minHeight: 44,
          justifyContent: 'center',
        },
        sheetDoneText: { fontSize: fontSize.md, color: colors.primary, fontWeight: weight.bold },
      }),
    [colors],
  );

  return (
    <>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('input.date')}: ${formatDate(value.toISOString())}`}
      >
        <CalendarDays size={18} color={colors.primary} />
        <Text style={styles.text}>{formatDate(value.toISOString())}</Text>
      </Pressable>

      {/*
        Picker v9 split the old single `onChange` (which encoded select/dismiss
        in event.type) into dedicated callbacks: `onValueChange` fires only on a
        real selection, `onDismiss` only on cancel.
      */}
      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value}
          mode="date"
          onValueChange={(_, picked) => {
            setOpen(false);
            onChange(picked);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
              <Pressable
                style={styles.sheetDone}
                onPress={() => setOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.sheetDoneText}>{t('common.done')}</Text>
              </Pressable>
              {/* The inline spinner stays mounted; the Done button closes it,
                  so only the value callback is needed here. */}
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                onValueChange={(_, picked) => onChange(picked)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
