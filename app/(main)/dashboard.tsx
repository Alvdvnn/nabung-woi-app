import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import PeriodSelector from '../../components/PeriodSelector';
import PieChartCard from '../../components/PieChartCard';
import StreakCard from '../../components/StreakCard';
import TopCategoriesRow from '../../components/TopCategoriesRow';
import { useStreak } from '../../hooks/useStreak';
import { colors, radius, spacing, fontSize, shadow } from '../../constants/theme';
import { getTransactions, Transaction } from '../../utils/storage';
import { filterByPeriod, Period, sumByCategory, totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>('month');

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTxs);
    }, [])
  );

  const filtered = filterByPeriod(txs, period);
  const totals = totalsOf(filtered);
  const byCategory = sumByCategory(filtered, 'expense');
  const streak = useStreak(txs);

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Dashboard" showLogo={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <PeriodSelector value={period} onChange={setPeriod} />

        <View style={styles.netCard}>
          <View style={styles.netHeader}>
            <Wallet size={18} color={colors.white} />
            <Text style={styles.netLabel}>Net Balance ({period})</Text>
          </View>
          <Text style={styles.netValue}>{formatIDR(totals.net)}</Text>
        </View>

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

        <StreakCard current={streak.current} longest={streak.longest} />
        <TopCategoriesRow data={byCategory} total={totals.expense} />
        <PieChartCard data={byCategory} total={totals.expense} />
      </ScrollView>
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  netCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  netHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  netLabel: { fontSize: fontSize.sm, color: colors.primarySoft, textTransform: 'capitalize' },
  netValue: { fontSize: fontSize.display, fontWeight: '800', color: colors.white, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.card,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  statValue: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
});
