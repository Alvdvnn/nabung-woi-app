import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize } from '../constants/theme';
import { formatDate } from '../utils/format';

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

export default function DatePickerField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '500' },
    sheet: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheetCard: {
      backgroundColor: colors.card,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    sheetDone: {
      alignSelf: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    sheetDoneText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '700' },
  }), [colors]);

  function handleAndroidChange(_: DateTimePickerEvent, picked?: Date) {
    setOpen(false);
    if (picked) onChange(picked);
  }

  function handleIosChange(_: DateTimePickerEvent, picked?: Date) {
    if (picked) onChange(picked);
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <CalendarDays size={18} color={colors.primary} />
        <Text style={styles.text}>{formatDate(value.toISOString())}</Text>
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker value={value} mode="date" onChange={handleAndroidChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
              <Pressable style={styles.sheetDone} onPress={() => setOpen(false)}>
                <Text style={styles.sheetDoneText}>Done</Text>
              </Pressable>
              <DateTimePicker value={value} mode="date" display="spinner" onChange={handleIosChange} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
