import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Period } from '../utils/aggregate';

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

const OPTIONS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export default function PeriodSelector({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: radius.full,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      alignItems: 'center',
    },
    btnActive: { backgroundColor: colors.primary },
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    labelActive: { color: colors.white },
  }), [colors]);

  return (
    <View style={styles.container}>
      {OPTIONS.map((o) => (
        <Pressable
          key={o.id}
          style={[styles.btn, value === o.id && styles.btnActive]}
          onPress={() => onChange(o.id)}
        >
          <Text style={[styles.label, value === o.id && styles.labelActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
