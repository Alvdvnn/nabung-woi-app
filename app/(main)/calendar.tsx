import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import { CalendarX, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import TransactionItem from '../../components/TransactionItem';
import EmptyState from '../../components/EmptyState';
import CalendarGrid from '../../components/CalendarGrid';
import { spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';
import { getAccounts, getTransactions, Account, Transaction } from '../../utils/storage';
import { isoDay, formatDate } from '../../utils/format';
import { totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    dayTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
    dayNet: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  }), [colors]);

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTxs);
      getAccounts().then(setAccounts);
    }, [])
  );

  const txDates = useMemo(() => new Set(txs.map((t) => isoDay(new Date(t.date)))), [txs]);
  const dayTxs = useMemo(
    () => txs.filter((t) => isoDay(new Date(t.date)) === isoDay(selected)),
    [txs, selected]
  );
  const dayTotals = useMemo(() => totalsOf(dayTxs), [dayTxs]);

  const accountNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, a.name);
    return m;
  }, [accounts]);

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
          <Text style={styles.dayNet}>
            {dayTotals.net >= 0 ? '+' : ''}{formatIDR(dayTotals.net)}
          </Text>
        </View>

        {dayTxs.length === 0 ? (
          <EmptyState Icon={CalendarX} title={t('calendar.empty')} subtitle={t('calendar.emptySub')} />
        ) : (
          dayTxs.map((t) => (
            <TransactionItem
              key={t.id}
              item={t}
              accountName={accountNameMap.get(t.accountId)}
              onPress={(id) => router.push({ pathname: '/', params: { id, returnTo: 'calendar' } })}
            />
          ))
        )}
      </ScrollView>
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}
