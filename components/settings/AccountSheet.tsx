import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowDown, ArrowUp, Scale, Trash2 } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { ACCOUNT_TYPES } from '../../constants/accountTypes';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../context/DataContext';
import { Account } from '../../utils/storage';
import { formatIDR, groupDigits } from '../../utils/format';
import { genId } from '../../utils/id';
import { useT } from '../../i18n';
import { tBuiltin } from '../../i18n/labels';

interface Props {
  visible: boolean;
  /** null creates a new account. */
  account: Account | null;
  onClose: () => void;
  onAdjust?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  /** Dialogs shown on top of this sheet (delete confirm). */
  overlay?: ReactNode;
}

/** Create or edit an account. Reordering lives here too (position = card order). */
export default function AccountSheet({ visible, account, onClose, onAdjust, onDelete, overlay }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { accounts, saveAccounts, balances } = useData();

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(ACCOUNT_TYPES[0].id);
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(account?.name ?? '');
    setTypeId(account?.typeId ?? ACCOUNT_TYPES[0].id);
    setBalance(account ? String(account.startingBalance) : '');
    setSaving(false);
  }, [visible, account]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { fontSize: fontSize.xs, fontWeight: weight.heavy, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
        input: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: 52,
          fontSize: fontSize.input,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
        actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
        actionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        actionText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textSecondary },
      }),
    [colors],
  );

  const index = account ? accounts.findIndex((a) => a.id === account.id) : -1;

  async function save() {
    if (!name.trim()) {
      toast.show('error', t('account.errName'));
      return;
    }
    setSaving(true);
    try {
      const starting = parseFloat(balance) || 0;
      if (account) {
        await saveAccounts(accounts.map((a) => (a.id === account.id ? { ...a, name: name.trim(), typeId, startingBalance: starting } : a)));
        toast.show('success', t('account.updated'));
      } else {
        await saveAccounts([...accounts, { id: genId('a'), name: name.trim(), typeId, startingBalance: starting }]);
        toast.show('success', t('account.added'));
      }
      onClose();
    } catch {
      toast.show('error', t('input.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function move(dir: -1 | 1) {
    if (!account || index < 0) return;
    const to = index + dir;
    if (to < 0 || to >= accounts.length) return;
    const next = accounts.slice();
    [next[index], next[to]] = [next[to], next[index]];
    await saveAccounts(next);
  }

  return (
    <Sheet
      visible={visible}
      title={account ? t('account.edit') : t('account.add')}
      subtitle={account ? `${t('adjust.currentBalance')}: ${formatIDR(balances.get(account.id) ?? account.startingBalance)}` : undefined}
      onClose={onClose}
      scroll
      overlay={overlay}
      footer={<Button label={account ? t('common.save') : t('account.create')} onPress={save} loading={saving} size="lg" />}
    >
      <View style={{ gap: spacing.lg }}>
        <View>
          <Text style={styles.label}>{t('account.name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('account.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            accessibilityLabel={t('account.name')}
            autoFocus={!account}
          />
        </View>

        <View>
          <Text style={styles.label}>{t('account.type')}</Text>
          <View style={styles.types}>
            {ACCOUNT_TYPES.map((ty) => (
              <Chip
                key={ty.id}
                label={tBuiltin(t, 'accountTypes', ty.id)}
                Icon={ty.icon}
                selected={ty.id === typeId}
                onPress={() => setTypeId(ty.id)}
              />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.label}>{t('account.startingBalance')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            inputMode="numeric"
            value={groupDigits(balance)}
            onChangeText={(v) => setBalance(v.replace(/[^0-9]/g, ''))}
            accessibilityLabel={t('account.startingBalance')}
          />
          <Text style={styles.hint}>{t('account.startingBalanceHint')}</Text>
        </View>

        {account ? (
          <View style={styles.actions}>
            {onAdjust ? (
              <Pressable style={styles.actionBtn} onPress={() => onAdjust(account)} accessibilityRole="button">
                <Scale size={16} color={colors.adjustment} />
                <Text style={styles.actionText}>{t('adjust.cta')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.actionBtn, index <= 0 && { opacity: 0.4 }]}
              onPress={() => move(-1)}
              disabled={index <= 0}
              accessibilityRole="button"
              accessibilityLabel={t('account.moveUp')}
            >
              <ArrowUp size={16} color={colors.textSecondary} />
              <Text style={styles.actionText}>{t('account.moveUp')}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, index >= accounts.length - 1 && { opacity: 0.4 }]}
              onPress={() => move(1)}
              disabled={index >= accounts.length - 1}
              accessibilityRole="button"
              accessibilityLabel={t('account.moveDown')}
            >
              <ArrowDown size={16} color={colors.textSecondary} />
              <Text style={styles.actionText}>{t('account.moveDown')}</Text>
            </Pressable>
            {onDelete ? (
              <Pressable
                style={[styles.actionBtn, { borderColor: colors.expenseLight }]}
                onPress={() => onDelete(account)}
                accessibilityRole="button"
              >
                <Trash2 size={16} color={colors.expense} />
                <Text style={[styles.actionText, { color: colors.expense }]}>{t('common.delete')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
