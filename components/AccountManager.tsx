import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { Account, saveAccounts } from '../utils/storage';
import { ACCOUNT_TYPES, findAccountType } from '../constants/accountTypes';
import { formatIDR } from '../utils/format';
import { genId } from '../utils/id';
import ConfirmModal from './ConfirmModal';
import { useT } from '../i18n';
import { tBuiltin } from '../i18n/labels';

interface Props {
  accounts: Account[];
  onChange: (accounts: Account[]) => void;
}

export default function AccountManager({ accounts, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(ACCOUNT_TYPES[0].id);
  const [balance, setBalance] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
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
    if (!name.trim()) { toast.show('error', t('account.errName')); return; }
    const next: Account[] = [
      ...accounts,
      {
        id: genId('a'),
        name: name.trim(),
        typeId,
        startingBalance: parseFloat(balance) || 0,
      },
    ];
    await saveAccounts(next);
    onChange(next);
    setName(''); setBalance(''); setTypeId(ACCOUNT_TYPES[0].id); setShowForm(false);
    toast.show('success', t('account.added'));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const next = accounts.filter((a) => a.id !== pendingDelete.id);
    await saveAccounts(next);
    onChange(next);
    setPendingDelete(null);
    toast.show('success', t('account.removed'));
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
              <Text style={styles.meta}>{tBuiltin(t, 'accountTypes', type.id)} • {formatIDR(a.startingBalance)}</Text>
            </View>
            <Pressable onPress={() => setPendingDelete(a)} hitSlop={8} style={styles.delBtn}>
              <Trash2 size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        );
      })}

      {!showForm ? (
        <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addText}>{t('account.add')}</Text>
        </Pressable>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('account.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map((ty) => {
              const TIcon = ty.icon;
              const active = ty.id === typeId;
              return (
                <Pressable
                  key={ty.id}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setTypeId(ty.id)}
                >
                  <TIcon size={14} color={active ? colors.white : colors.textSecondary} />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{tBuiltin(t, 'accountTypes', ty.id)}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('account.balancePlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={balance ? Number(balance).toLocaleString('id-ID') : ''}
            onChangeText={(v) => setBalance(v.replace(/[^0-9]/g, ''))}
          />
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable style={[styles.formBtn, styles.createBtn]} onPress={create}>
              <Text style={styles.createText}>{t('account.create')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ConfirmModal
        visible={!!pendingDelete}
        title={t('account.deleteTitle')}
        message={pendingDelete ? t('account.deleteMsg', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
