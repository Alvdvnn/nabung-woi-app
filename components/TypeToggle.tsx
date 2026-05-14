import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import { colors, radius, spacing, fontSize } from '../constants/theme';
import { TransactionType } from '../utils/storage';

interface Props {
  value: TransactionType;
  onChange: (v: TransactionType) => void;
}

export default function TypeToggle({ value, onChange }: Props) {
  const isExp = value === 'expense';
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, isExp && styles.btnActiveExp]}
        onPress={() => onChange('expense')}
      >
        <ArrowDownCircle size={16} color={isExp ? colors.white : colors.textSecondary} />
        <Text style={[styles.label, isExp && styles.labelActive]}>Expense</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, !isExp && styles.btnActiveInc]}
        onPress={() => onChange('income')}
      >
        <ArrowUpCircle size={16} color={!isExp ? colors.white : colors.textSecondary} />
        <Text style={[styles.label, !isExp && styles.labelActive]}>Income</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  btnActiveExp: { backgroundColor: colors.expense },
  btnActiveInc: { backgroundColor: colors.income },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  labelActive: { color: colors.white },
});
