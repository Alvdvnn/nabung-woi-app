import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Account, saveAccounts } from '../utils/storage';
import { ACCOUNT_TYPES, findAccountType } from '../constants/accountTypes';
import { formatIDR } from '../utils/format';

interface Props {
  accounts: Account[];
  onChange: (accounts: Account[]) => void;
}

export default function AccountManager({ accounts, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(ACCOUNT_TYPES[0].id);
  const [balance, setBalance] = useState('');
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 36, height: 36, borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center', justifyContent: 'center',
      marginRight: spacing.md,
    },
    info: { flex: 1 },
    name: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
    meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    delBtn: { padding: 4 },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: spacing.md,
      borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
    },
    addText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
    form: { gap: spacing.sm, backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    input: {
      backgroundColor: colors.bg, borderRadius: radius.sm, padding: spacing.md,
      fontSize: fontSize.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    typeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
    },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
    typeLabelActive: { color: colors.white },
    formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    formBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, alignItems: 'center' },
    cancelBtn: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
    createBtn: { backgroundColor: colors.primary },
    cancelText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    createText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
  }), [colors]);

  async function create() {
    if (!name.trim()) return Alert.alert('Enter an account name');
    const next: Account[] = [
      ...accounts,
      {
        id: Date.now().toString(),
        name: name.trim(),
        typeId,
        startingBalance: parseFloat(balance) || 0,
      },
    ];
    await saveAccounts(next);
    onChange(next);
    setName(''); setBalance(''); setTypeId(ACCOUNT_TYPES[0].id); setShowForm(false);
  }

  function remove(id: string) {
    Alert.alert('Delete account?', 'Transactions referencing it will keep their data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const next = accounts.filter((a) => a.id !== id);
          await saveAccounts(next);
          onChange(next);
        },
      },
    ]);
  }

  return (
    <View>
      {accounts.map((a) => {
        const type = findAccountType(a.typeId);
        const TypeIcon = type.icon;
        return (
          <View key={a.id} style={styles.row}>
            <View style={styles.iconWrap}><TypeIcon size={18} color={colors.primary} /></View>
            <View style={styles.info}>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.meta}>{type.name} • {formatIDR(a.startingBalance)}</Text>
            </View>
            <Pressable onPress={() => remove(a.id)} hitSlop={8} style={styles.delBtn}>
              <Trash2 size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        );
      })}

      {!showForm ? (
        <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addText}>Add Account</Text>
        </Pressable>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Account name (e.g. BCA)"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map((t) => {
              const TIcon = t.icon;
              const active = t.id === typeId;
              return (
                <Pressable
                  key={t.id}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setTypeId(t.id)}
                >
                  <TIcon size={14} color={active ? colors.white : colors.textSecondary} />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Starting balance (Rp)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={balance ? Number(balance).toLocaleString('id-ID') : ''}
            onChangeText={(v) => setBalance(v.replace(/[^0-9]/g, ''))}
          />
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.formBtn, styles.createBtn]} onPress={create}>
              <Text style={styles.createText}>Create</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
