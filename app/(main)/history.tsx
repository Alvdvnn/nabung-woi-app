import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import { Inbox, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import TransactionItem from '../../components/TransactionItem';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { radius, spacing, fontSize, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { deleteTransaction, getAccounts, getTransactions, Account, Transaction, TransactionType } from '../../utils/storage';
import { useT } from '../../i18n';
import dayjs from 'dayjs'; 

type Filter = 'all' | TransactionType;

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();

  const [txs, setTxs] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(dayjs()); 

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: t('type.all') },
    { id: 'income', label: t('type.income') },
    { id: 'expense', label: t('type.expense') },
  ];

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTxs);
      getAccounts().then(setAccounts);
    }, [])
  );

  const handlePrevMonth = () => setCurrentMonth(prev => prev.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(prev => prev.add(1, 'month'));

  const txsInSelectedMonth = useMemo(() => {
    return txs.filter((t) => {
      const txDate = dayjs(t.date);
      return txDate.isSame(currentMonth, 'month');
    });
  }, [txs, currentMonth]);

  const filtered = useMemo(() => {
    if (filter === 'all') return txsInSelectedMonth;
    return txsInSelectedMonth.filter((t) => t.type === filter);
  }, [txsInSelectedMonth, filter]);

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
    toast.show('success', t('history.deleted'));
  }

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    
    monthPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.sm,
    },
    monthNavBtn: { padding: spacing.sm },
    monthTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    monthText: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
    
    filters: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    filterBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    filterLabelActive: { color: colors.white },
    
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  }), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title={t('history.title')} showLogo={false} />
      
      {/* 1. Komponen Filter Bulan */}
      <View style={styles.monthPicker}>
        <Pressable onPress={handlePrevMonth} style={styles.monthNavBtn}>
          <ChevronLeft size={20} color={colors.textSecondary} />
        </Pressable>
        
        <View style={styles.monthTextWrap}>
          <CalendarIcon size={16} color={colors.primary} />
          {/* Format bulan misal: "May 2026" */}
          <Text style={styles.monthText}>{currentMonth.format('MMMM YYYY')}</Text>
        </View>

        <Pressable onPress={handleNextMonth} style={styles.monthNavBtn}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* 2. Filter Tipe Transaksi */}
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

      {/* 3. Daftar Transaksi */}
      {filtered.length === 0 ? (
        <EmptyState Icon={Inbox} title={t('history.empty')} subtitle={t('history.emptySub')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          showsVerticalScrollIndicator={false}
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
        title={t('history.deleteTitle')}
        message={t('history.deleteMsg')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </SafeAreaView>
  );
}