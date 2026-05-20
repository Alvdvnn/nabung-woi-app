import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, FlatList } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import { TrendingUp, TrendingDown, Wallet, Plus, CreditCard, ArrowRightLeft } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import PeriodSelector from '../../components/PeriodSelector';
import PieChartCard from '../../components/PieChartCard';
import StreakCard from '../../components/StreakCard';
import TopCategoriesRow from '../../components/TopCategoriesRow';
import { useStreak } from '../../hooks/useStreak';
import { radius, spacing, fontSize, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { getTransactions, getAccounts, Transaction, Account } from '../../utils/storage';
import { filterByPeriod, Period, sumByCategory, totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';
// Jika kamu mau iconnya dinamis sesuai tipe akun, uncomment baris di bawah ini:
// import { findAccountType } from '../../constants/accountTypes';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTxs);
      getAccounts().then(setAccounts);
    }, [])
  );

  const filtered = filterByPeriod(txs, period);
  const totals = totalsOf(filtered);
  const byCategory = sumByCategory(filtered, 'expense');
  const streak = useStreak(txs);

  const accountBalances = useMemo(() => {
    return accounts.map(acc => {
      const accTxs = txs.filter(t => t.accountId === acc.id);
      const income = accTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = accTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return {
        ...acc,
        currentBalance: acc.startingBalance + income - expense
      };
    });
  }, [accounts, txs]);

  const totalAccountBalance = useMemo(() => {
    return accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [accountBalances]);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    
    netCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      padding: spacing.lg,
      ...shadow.card,
    },
    netHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    netLabel: { fontSize: fontSize.sm, color: colors.primarySoft, textTransform: 'capitalize' },
    netValue: { fontSize: fontSize.display, fontWeight: '800', color: colors.white, marginTop: 6 },
    
    accountsList: { flexGrow: 0, marginBottom: spacing.sm },
    accountCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginRight: spacing.md,
      minWidth: 130,
      ...shadow.card,
    },
    accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    // PERBAIKAN WARNA DI SINI:
    accountName: { fontSize: fontSize.xs, color: colors.textSecondary }, 
    accountBalance: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },

    statsRow: { flexDirection: 'row', gap: spacing.md },
    statCard: {
      flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
      padding: spacing.md, ...shadow.card,
    },
    statIcon: {
      width: 32, height: 32, borderRadius: radius.full,
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
    },
    // PERBAIKAN WARNA DI SINI:
    statLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
    statValue: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
    
    periodNetCard: {
      backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      ...shadow.card,
    },
    periodNetLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    // PERBAIKAN WARNA DI SINI:
    periodNetLabel: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '600' },
    periodNetValue: { fontSize: fontSize.md, fontWeight: '800' },
    
    // PERBAIKAN WARNA DI SINI (Judul "Cashflow"):
    sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  }), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Dashboard" showLogo={false} />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.netCard}>
          <View style={styles.netHeader}>
            <Wallet size={18} color={colors.white} />
            <Text style={styles.netLabel}>Total Balance</Text>
          </View>
          <Text style={styles.netValue}>{formatIDR(totalAccountBalance)}</Text>
        </View>

        <FlatList
          data={accountBalances}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            // Jika mau icon dinamis sesuai type (opsional):
            // const TypeIcon = findAccountType(item.typeId)?.icon || Wallet;
            return (
              <View style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <CreditCard size={14} color={colors.primary} />
                  <Text style={styles.accountName}>{item.name}</Text>
                </View>
                <Text style={styles.accountBalance}>{formatIDR(item.currentBalance)}</Text>
              </View>
            )
          }}
        />

        {/* Teks "Cashflow" juga akan jadi putih di Dark Mode */}
        <Text style={styles.sectionTitle}>Cashflow</Text>
        <PeriodSelector value={period} onChange={setPeriod} />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.incomeLight }]}>
              <TrendingUp size={16} color={colors.income} />
            </View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>{formatIDR(totals.income)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.expenseLight }]}>
              <TrendingDown size={16} color={colors.expense} />
            </View>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>{formatIDR(totals.expense)}</Text>
          </View>
        </View>

        <View style={styles.periodNetCard}>
          <View style={styles.periodNetLeft}>
            <ArrowRightLeft size={16} color={colors.textSecondary} />
            <Text style={styles.periodNetLabel}>Net Flow ({period})</Text>
          </View>
          <Text style={[
            styles.periodNetValue, 
            { color: totals.net >= 0 ? colors.income : colors.expense }
          ]}>
            {totals.net > 0 ? '+' : ''}{formatIDR(totals.net)}
          </Text>
        </View>

        <StreakCard current={streak.current} longest={streak.longest} />
        <TopCategoriesRow data={byCategory} total={totals.expense} />
        <PieChartCard data={byCategory} total={totals.expense} />
        
      </ScrollView>
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}