import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { TransactionType } from '../utils/storage';
import { useT } from '../i18n';

interface Props {
  value: TransactionType;
  onChange: (v: TransactionType) => void;
}

export default function TypeToggle({ value, onChange }: Props) {
  const { colors } = useTheme();
  const t = useT();
  
  const styles = useMemo(() => StyleSheet.create({
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
    btnActiveTrans: { backgroundColor: colors.primary }, // Menggunakan warna utama (biru/ungu) untuk transfer
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    labelActive: { color: colors.white },
  }), [colors]);

  const isExp = value === 'expense';
  const isInc = value === 'income';
  const isTrans = value === 'transfer';

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, isExp && styles.btnActiveExp]}
        onPress={() => onChange('expense')}
      >
        <ArrowDownCircle size={16} color={isExp ? colors.white : colors.textSecondary} />
        <Text style={[styles.label, isExp && styles.labelActive]}>{t('type.expense')}</Text>
      </Pressable>
      
      <Pressable
        style={[styles.btn, isInc && styles.btnActiveInc]}
        onPress={() => onChange('income')}
      >
        <ArrowUpCircle size={16} color={isInc ? colors.white : colors.textSecondary} />
        <Text style={[styles.label, isInc && styles.labelActive]}>{t('type.income')}</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, isTrans && styles.btnActiveTrans]}
        onPress={() => onChange('transfer')}
      >
        <ArrowRightLeft size={16} color={isTrans ? colors.white : colors.textSecondary} />
        {/* Tambahan fallback 'Transfer' jaga-jaga jika belum ada di file bahasa (i18n) */}
        <Text style={[styles.label, isTrans && styles.labelActive]}>{t('type.transfer') ?? 'Transfer'}</Text>
      </Pressable>
    </View>
  );
}
