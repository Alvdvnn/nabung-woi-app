import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import { Inbox, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import TransactionItem from '../../components/TransactionItem';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { radius, spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { deleteTransaction, getAccounts, getTransactions, Account, Transaction, TransactionType } from '../../utils/storage';

type Filter = 'all' | TransactionType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
];

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    filters: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    filterBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    filterLabelActive: { color: colors.white },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  }), [colors]);

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTxs);
      getAccounts().then(setAccounts);
    }, [])
  );

  const filtered = useMemo(
    () => (filter === 'all' ? txs : txs.filter((t) => t.type === filter)),
    [txs, filter]
  );

  const accountNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, a.name);
    return m;
  }, [accounts]);

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await deleteTransaction(pendingDeleteId);
    setTxs((prev) => prev.filter((t) => t.id !== pendingDeleteId));
    setPendingDeleteId(null);
    toast.show('success', 'Transaction deleted');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="History" showLogo={false} />
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterLabel, filter === f.id && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState Icon={Inbox} title="No transactions" subtitle="Tap the home tab to add your first one." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              accountName={accountNameMap.get(item.accountId)}
              onDelete={handleDelete}
              onPress={(id) => router.push({ pathname: '/', params: { id, returnTo: 'history' } })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />

      <ConfirmModal
        visible={!!pendingDeleteId}
        title="Delete transaction?"
        message="This entry will be removed from your history."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </SafeAreaView>
  );
}
