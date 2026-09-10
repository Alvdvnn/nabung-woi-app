import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Scale, Trash2 } from 'lucide-react-native';
import Button from '../ui/Button';
import ConfirmModal from '../feedback/ConfirmModal';
import AdjustBalanceSheet from './AdjustBalanceSheet';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../context/DataContext';
import { Account } from '../../utils/storage';
import { ACCOUNT_TYPES, findAccountType } from '../../constants/accountTypes';
import { formatIDR, groupDigits } from '../../utils/format';
import { genId } from '../../utils/id';
import { useT } from '../../i18n';
import { tBuiltin } from '../../i18n/labels';

interface Props {
  accounts: Account[];
  onChange: (accounts: Account[]) => void | Promise<void>;
}

export default function AccountManager({ accounts, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(ACCOUNT_TYPES[0].id);
  const [balance, setBalance] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);
  const { colors } = useTheme();
  const toast = useToast();
  const { balances } = useData();
  const t = useT();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconWrap: {
          width: 38,
          height: 38,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        },
        info: { flex: 1 },
        name: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.textPrimary },
        meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
        form: {
          gap: spacing.sm,
          backgroundColor: colors.surface,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        input: {
          backgroundColor: colors.bg,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          minHeight: 48,
          fontSize: fontSize.md,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
        typeBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.md,
          minHeight: 44,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg,
        },
        typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        typeLabel: { fontSize: fontSize.xs, fontWeight: weight.semibold, color: colors.textSecondary },
        typeLabelActive: { color: colors.onPrimary },
        formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
      }),
    [colors],
  );

  async function create() {
    if (!name.trim()) {
      toast.show('error', t('account.errName'));
      return;
    }
    const next: Account[] = [
      ...accounts,
      { id: genId('a'), name: name.trim(), typeId, startingBalance: parseFloat(balance) || 0 },
    ];
    await onChange(next);
    setName('');
    setBalance('');
    setTypeId(ACCOUNT_TYPES[0].id);
    setShowForm(false);
    toast.show('success', t('account.added'));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await onChange(accounts.filter((a) => a.id !== pendingDelete.id));
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
            <View style={styles.iconWrap}>
              <TypeIcon size={18} color={colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{a.name}</Text>
              {/* Current balance, not the starting figure - that is what the
                  user recognizes and what an adjustment acts on. */}
              <Text style={styles.meta}>
                {`${tBuiltin(t, 'accountTypes', type.id)} · ${formatIDR(balances.get(a.id) ?? a.startingBalance)}`}
              </Text>
            </View>
            <Pressable
              onPress={() => setAdjustTarget(a)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={`${t('adjust.cta')}: ${a.name}`}
            >
              <Scale size={16} color={colors.adjustment} />
            </Pressable>
            <Pressable
              onPress={() => setPendingDelete(a)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={`${t('common.delete')}: ${a.name}`}
            >
              <Trash2 size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        );
      })}

      {!showForm ? (
        <Button label={t('account.add')} Icon={Plus} variant="secondary" onPress={() => setShowForm(true)} />
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('account.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            accessibilityLabel={t('account.namePlaceholder')}
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
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <TIcon size={14} color={active ? colors.onPrimary : colors.textSecondary} />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                    {tBuiltin(t, 'accountTypes', ty.id)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('account.balancePlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={groupDigits(balance)}
            onChangeText={(v) => setBalance(v.replace(/[^0-9]/g, ''))}
            accessibilityLabel={t('account.balancePlaceholder')}
          />
          <View style={styles.formActions}>
            <Button label={t('common.cancel')} variant="secondary" onPress={() => setShowForm(false)} fullWidth />
            <Button label={t('account.create')} onPress={create} fullWidth />
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

      <AdjustBalanceSheet
        visible={!!adjustTarget}
        account={adjustTarget}
        onClose={() => setAdjustTarget(null)}
      />
    </View>
  );
}
