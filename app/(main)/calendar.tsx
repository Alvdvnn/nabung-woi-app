import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { CalendarX, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import TransactionItem from '../../components/TransactionItem';
import EmptyState from '../../components/EmptyState';
import CalendarGrid from '../../components/CalendarGrid';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';
import { useData } from '../../context/DataContext';
import { isoDay, formatDate } from '../../utils/format';
import { totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { txs, accounts, deleteTx } = useData();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: contentBottomForFab(insets.bottom) },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    dayTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
    dayNet: { fontSize: fontSize.md, fontWeight: '700' },
  }), [colors, insets.bottom]);

  const txDates = useMemo(() => new Set(txs.map((tx) => tx.dayKey)), [txs]);
  const selectedKey = useMemo(() => isoDay(selected), [selected]);
  const dayTxs = useMemo(
    () => txs.filter((tx) => tx.dayKey === selectedKey),
    [txs, selectedKey]
  );
  const dayTotals = useMemo(() => totalsOf(dayTxs), [dayTxs]);

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
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await deleteTx(id);
      toast.show('success', t('history.deleted'));
    } catch {
      toast.show('error', t('history.deleteFailed'));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title={t('calendar.title')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <CalendarGrid
          month={month}
          selected={selected}
          txDates={txDates}
          onChangeMonth={setMonth}
          onSelectDate={setSelected}
        />

        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{formatDate(selected.toISOString())}</Text>
          <Text style={[styles.dayNet, { color: dayTotals.net >= 0 ? colors.income : colors.expense }]}>
            {dayTotals.net >= 0 ? '+' : ''}{formatIDR(dayTotals.net)}
          </Text>
        </View>

        {dayTxs.length === 0 ? (
          <EmptyState Icon={CalendarX} title={t('calendar.empty')} subtitle={t('calendar.emptySub')} />
        ) : (
          dayTxs.map((tx) => (
            <TransactionItem
              key={tx.id}
              item={tx}
              accountName={accountNameMap.get(tx.accountId)}
              onPress={(id) => router.push({ pathname: '/', params: { id, returnTo: 'calendar' } })}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
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
