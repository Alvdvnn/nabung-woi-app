import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Wallet } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import AccountSheet from '../../components/settings/AccountSheet';
import AdjustBalanceSheet from '../../components/account/AdjustBalanceSheet';
import { fontSize, spacing, weight } from '../../constants/theme';
import { ACCOUNT_TYPES } from '../../constants/accountTypes';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../context/DataContext';
import { Account } from '../../utils/storage';
import { formatIDR } from '../../utils/format';
import { rangeFor, rangeToParams } from '../../utils/period';
import { useT } from '../../i18n';
import { tBuiltin } from '../../i18n/labels';

/** Accounts grouped by type with live balances. Tap to edit, long-press to open. */
export default function AccountsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { accounts, balances, saveAccounts, totalBalance } = useData();

  const [editing, setEditing] = useState<Account | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        total: { gap: 2, paddingHorizontal: spacing.xs },
        totalLabel: { fontSize: fontSize.xs, fontWeight: weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
        totalValue: { fontSize: fontSize.display, lineHeight: 40, fontWeight: weight.black, color: colors.textPrimary, letterSpacing: -0.8 },
      }),
    [colors, insets.bottom],
  );

  const groups = useMemo(
    () =>
      ACCOUNT_TYPES.map((ty) => {
        const list = accounts.filter((a) => a.typeId === ty.id);
        const subtotal = list.reduce((sum, a) => sum + (balances.get(a.id) ?? a.startingBalance), 0);
        return { type: ty, list, subtotal };
      }).filter((g) => g.list.length > 0),
    [accounts, balances],
  );

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setSheetOpen(true);
  };

  async function confirmDelete() {
    if (!pendingDelete) return;
    await saveAccounts(accounts.filter((a) => a.id !== pendingDelete.id));
    setPendingDelete(null);
    setSheetOpen(false);
    toast.show('success', t('account.removed'));
  }

  return (
    <Screen>
      <TopBar title={t('settings.accounts')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {accounts.length === 0 ? (
          <EmptyState
            Icon={Wallet}
            title={t('account.emptyTitle')}
            subtitle={t('account.emptySub')}
            action={{ label: t('account.add'), onPress: openCreate }}
          />
        ) : (
          <>
            <View style={styles.total}>
              <Text style={styles.totalLabel}>{t('dashboard.totalBalance')}</Text>
              <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(totalBalance)}
              </Text>
            </View>

            {groups.map((g) => (
              <SectionGroup
                key={g.type.id}
                title={`${tBuiltin(t, 'accountTypes', g.type.id)} · ${formatIDR(g.subtotal)}`}
              >
                {g.list.map((a) => (
                  <ListRow
                    key={a.id}
                    Icon={g.type.icon}
                    title={a.name}
                    subtitle={t('account.startingBalanceShort', { amount: formatIDR(a.startingBalance) })}
                    value={formatIDR(balances.get(a.id) ?? a.startingBalance)}
                    valueColor={colors.textPrimary}
                    trailing="chevron"
                    onPress={() => openEdit(a)}
                    onLongPress={() =>
                      router.push({ pathname: '/account-detail', params: { accountId: a.id, ...rangeToParams(rangeFor('month')) } })
                    }
                    accessibilityHint={t('account.rowHint')}
                  />
                ))}
              </SectionGroup>
            ))}

            <Button label={t('account.add')} Icon={Plus} variant="secondary" onPress={openCreate} />
          </>
        )}
      </ScrollView>

      <AccountSheet
        visible={sheetOpen}
        account={editing}
        onClose={() => setSheetOpen(false)}
        onAdjust={(a) => {
          setSheetOpen(false);
          setAdjustTarget(a);
        }}
        onDelete={(a) => setPendingDelete(a)}
        overlay={
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
        }
      />

      <AdjustBalanceSheet visible={!!adjustTarget} account={adjustTarget} onClose={() => setAdjustTarget(null)} />
    </Screen>
  );
}
