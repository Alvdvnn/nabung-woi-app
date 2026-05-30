import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize } from '../constants/theme';
import { formatDate, isoDay } from '../utils/format';

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

export default function DatePickerField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const inputRef = useRef<any>(null);

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
      position: 'relative',
    },
    text: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '500' },
  }), [colors]);

  function open() {
    const el = inputRef.current as HTMLInputElement | null;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch {}
    }
    el.click();
    el.focus();
  }

  return (
    <Pressable style={styles.field} onPress={open}>
      <CalendarDays size={18} color={colors.primary} />
      <Text style={styles.text}>{formatDate(value.toISOString())}</Text>
      {/* Hidden native date input — drives the picker on web. */}
      {/* @ts-ignore react-native-web passes unknown props to the DOM */}
      <input
        ref={inputRef}
        type="date"
        value={isoDay(value)}
        onChange={(e: any) => {
          const v = e.target.value as string;
          if (!v) return;
          const [y, m, d] = v.split('-').map(Number);
          onChange(new Date(y, m - 1, d));
        }}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          width: '100%',
          height: '100%',
          border: 0,
          padding: 0,
          background: 'transparent',
          cursor: 'pointer',
        }}
      />
    </Pressable>
  );
}
