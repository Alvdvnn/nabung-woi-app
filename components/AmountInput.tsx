import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { groupDigits } from '../utils/format';

interface Props {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}

export default function AmountInput({ value, onChange, autoFocus = true }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xl,
    },
    currency: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.primary,
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: fontSize.display,
      fontWeight: '800',
      color: colors.textPrimary,
      padding: 0,
    },
  }), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.currency}>Rp</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={groupDigits(value)}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
        autoFocus={autoFocus}
      />
    </View>
  );
}
