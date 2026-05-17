import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarX, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import TransactionItem from '../../components/TransactionItem';
import EmptyState from '../../components/EmptyState';
import CalendarGrid from '../../components/CalendarGrid';
import { spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { getAccounts, getTransactions, Account, Transaction } from '../../utils/storage';
import { isoDay, formatDate } from '../../utils/format';
import { totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';

export default function CalendarScreen() {
  const router = useRouter();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const { colors } = useTheme();
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
  const dayTotals = totalsOf(dayTxs);

  function accName(id: string) {
    return accounts.find((a) => a.id === id)?.name;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Calendar" showLogo={false} />
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
          <EmptyState Icon={CalendarX} title="No transactions" subtitle="Nothing recorded on this day." />
        ) : (
          dayTxs.map((t) => (
            <TransactionItem
              key={t.id}
              item={t}
              accountName={accName(t.accountId)}
              onPress={(id) => router.push({ pathname: '/', params: { id } })}
            />
          ))
        )}
      </ScrollView>
      <Fab Icon={Plus} bottom={80} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}
