import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowRightLeft,
  Eye,
  EyeClosed,
} from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import PeriodSelector from '../../components/PeriodSelector';
import PieChartCard from '../../components/PieChartCard';
import StreakCard from '../../components/StreakCard';
import TopCategoriesRow from '../../components/TopCategoriesRow';
import { useStreak } from '../../hooks/useStreak';
import { radius, spacing, fontSize, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions, useAccounts } from '../../context/DataContext';
import { filterByPeriod, Period, sumByCategory, totalsOf } from '../../utils/aggregate';
import { getBalanceHidden, setBalanceHidden } from '../../utils/storage';
import { formatIDR } from '../../utils/format';
import { findAccountType } from '../../constants/accountTypes';
import { useT } from '../../i18n';
import { tBuiltin, tPeriod } from '../../i18n/labels';

const CARD_HEIGHT = 68;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const t = useT();

  const txs = useTransactions();
  const accounts = useAccounts();
  const [period, setPeriod] = useState<Period>('month');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    getBalanceHidden().then(setHidden);
  }, []);

  const toggleHidden = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      setBalanceHidden(next);
      return next;
    });
  }, []);

  const mask = useCallback(
    (value: number) => (hidden ? 'Rp ******' : formatIDR(value)),
    [hidden]
  );

  const filtered = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const totals = useMemo(() => totalsOf(filtered), [filtered]);
  const byCategory = useMemo(() => sumByCategory(filtered, 'expense'), [filtered]);
  const streak = useStreak(txs);

  const accountBalances = useMemo(() => {
    return accounts.map((acc) => {
      const accTxs = txs.filter((t) => t.accountId === acc.id || t.toAccountId === acc.id);
      
      const income = accTxs.filter((t) => t.type === 'income' && t.accountId === acc.id).reduce((sum, t) => sum + t.amount, 0);
      const expense = accTxs.filter((t) => t.type === 'expense' && t.accountId === acc.id).reduce((sum, t) => sum + t.amount, 0);
      const transferOut = accTxs.filter((t) => t.type === 'transfer' && t.accountId === acc.id).reduce((sum, t) => sum + t.amount, 0);
      const transferIn = accTxs.filter((t) => t.type === 'transfer' && t.toAccountId === acc.id).reduce((sum, t) => sum + t.amount, 0);
      
      return {
        ...acc,
        currentBalance: acc.startingBalance + income - expense - transferOut + transferIn
      };
    });
  }, [accounts, txs]);

  const totalAccountBalance = useMemo(
    () => accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0),
    [accountBalances]
  );

  function openCategoryDetail(categoryId: string) {
    router.push({ pathname: '/category-detail', params: { categoryId, period } });
  }

  function openAccountDetail(accountId: string) {
    router.push({ pathname: '/account-detail', params: { accountId, period } });
  }

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingBottom: contentBottomForFab(insets.bottom) },

    hero: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl + CARD_HEIGHT / 2 + 14,
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: -28,
    },
    balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    balanceLabel: {
      color: colors.primarySoft,
      fontSize: fontSize.sm,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    balanceValueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: 8,
    },
    balanceValue: {
      flex: 1,
      color: colors.white,
      fontSize: 44,
      fontWeight: '900',
      letterSpacing: -1,
      lineHeight: 50,
    },
    eyeBtn: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: -2,
    },

    accountsWrap: {
      marginTop: -CARD_HEIGHT / 2,
      marginBottom: spacing.md,
    },
    accountsContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    accountCard: {
      width: 172,
      height: CARD_HEIGHT,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    accountMain: { flex: 1, gap: 2 },
    accountTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    accountName: {
      fontSize: fontSize.sm,
      color: colors.textPrimary,
      fontWeight: '700',
      flexShrink: 1,
    },
    accountTypePill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.primarySoft,
    },
    accountTypeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    accountBalance: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginTop: 2,
    },
    accountIconWrap: {
      width: 30, height: 30, borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    accountEmpty: {
      marginHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      ...shadow.card,
    },
    accountEmptyText: { color: colors.textMuted, fontSize: fontSize.sm },

    body: { paddingHorizontal: spacing.lg, gap: spacing.md },

    statsRow: { flexDirection: 'row', gap: spacing.md },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    statIcon: {
      width: 32, height: 32, borderRadius: radius.full,
      alignItems: 'center', justifyContent: 'center',
    },
    statLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '700' },
    statValue: { fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },

    netCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
    },
    netLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    netLabel: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '600' },
    netValue: { fontSize: fontSize.md, fontWeight: '800' },

    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
  }), [colors, resolved, insets.bottom]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <TopBar title={t('tabs.dashboard')} showLogo={false} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.balanceLabelRow}>
            <Wallet size={14} color={colors.primarySoft} />
            <Text style={styles.balanceLabel}>{t('dashboard.totalBalance')}</Text>
          </View>
          <View style={styles.balanceValueRow}>
            <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
              {mask(totalAccountBalance)}
            </Text>
            <Pressable
              onPress={toggleHidden}
              hitSlop={12}
              style={styles.eyeBtn}
              accessibilityLabel={hidden ? t('dashboard.showBalance') : t('dashboard.hideBalance')}
            >
              {hidden ? (
                <EyeClosed size={16} color={colors.white} />
              ) : (
                <Eye size={16} color={colors.white} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.sheet}>
        <View style={styles.accountsWrap}>
          {accountBalances.length === 0 ? (
            <View style={styles.accountEmpty}>
              <Text style={styles.accountEmptyText}>
                {t('dashboard.noAccounts')}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsContent}
            >
              {accountBalances.map((item) => {
                const type = findAccountType(item.typeId);
                const TypeIcon = type.icon;
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.accountCard, pressed && { transform: [{ scale: 0.97 }] }]}
                    onPress={() => openAccountDetail(item.id)}
                  >
                    <View style={styles.accountIconWrap}>
                      <TypeIcon size={15} color={colors.primary} />
                    </View>
                    <View style={styles.accountMain}>
                      <View style={styles.accountTitleRow}>
                        <Text style={styles.accountName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.accountTypePill}>
                          <Text style={styles.accountTypeText}>{tBuiltin(t, 'accountTypes', type.id)}</Text>
                        </View>
                      </View>
                      <Text style={styles.accountBalance} numberOfLines={1} adjustsFontSizeToFit>
                        {mask(item.currentBalance)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>{t('dashboard.cashflow')}</Text>
          <PeriodSelector value={period} onChange={setPeriod} />

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: colors.incomeLight }]}>
                  <TrendingUp size={16} color={colors.income} />
                </View>
                <Text style={styles.statLabel}>{t('type.income')}</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(totals.income)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: colors.expenseLight }]}>
                  <TrendingDown size={16} color={colors.expense} />
                </View>
                <Text style={styles.statLabel}>{t('type.expense')}</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(totals.expense)}
              </Text>
            </View>
          </View>

          <View style={styles.netCard}>
            <View style={styles.netLeft}>
              <ArrowRightLeft size={16} color={colors.textSecondary} />
              <Text style={styles.netLabel}>{t('dashboard.netFlow', { period: tPeriod(t, period) })}</Text>
            </View>
            <Text style={[
              styles.netValue,
              { color: totals.net >= 0 ? colors.income : colors.expense },
            ]}>
              {totals.net >= 0 ? '+' : ''}{formatIDR(totals.net)}
            </Text>
          </View>

          <StreakCard current={streak.current} longest={streak.longest} />

          {byCategory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('dashboard.topCategories')}</Text>
              <TopCategoriesRow
                data={byCategory}
                total={totals.expense}
                onPress={openCategoryDetail}
              />
              <PieChartCard data={byCategory} total={totals.expense} />
            </>
          )}
        </View>
        </View>
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}