import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowRightLeft,
  Eye,
  EyeClosed,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import Card from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import SectionHeader from '../../components/ui/SectionHeader';
import SegmentedControl, { Segment } from '../../components/ui/SegmentedControl';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import PieChartCard from '../../components/charts/PieChartCard';
import StreakCard from '../../components/dashboard/StreakCard';
import TopCategoriesRow from '../../components/dashboard/TopCategoriesRow';
import AdjustBalanceSheet from '../../components/account/AdjustBalanceSheet';
import { useStreak } from '../../hooks/useStreak';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { Account, getBalanceHidden, setBalanceHidden } from '../../utils/storage';
import { filterByPeriod, Period, sumByCategory, totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';
import { findAccountType } from '../../constants/accountTypes';
import { useT } from '../../i18n';
import { tBuiltin, tPeriod } from '../../i18n/labels';

const CARD_HEIGHT = 76;
const MASKED = 'Rp ******';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const t = useT();

  const { txs, accounts, balances, totalBalance, hydrated } = useData();
  const [period, setPeriod] = useState<Period>('month');
  const [hidden, setHidden] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);

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

  const mask = useCallback((value: number) => (hidden ? MASKED : formatIDR(value)), [hidden]);

  const filtered = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const totals = useMemo(() => totalsOf(filtered), [filtered]);
  const byCategory = useMemo(() => sumByCategory(filtered, 'expense'), [filtered]);
  const streak = useStreak(txs);

  const periodOptions = useMemo<Segment<Period>[]>(
    () => [
      { id: 'day', label: t('period.day') },
      { id: 'month', label: t('period.month') },
      { id: 'year', label: t('period.year') },
    ],
    [t],
  );

  const openAdjust = useCallback((account: Account) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setAdjustTarget(account);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { paddingBottom: contentBottomForFab(insets.bottom) },

        hero: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl + CARD_HEIGHT / 2 + 14,
        },
        sheet: {
          backgroundColor: colors.bg,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          marginTop: -28,
        },
        balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        balanceLabel: {
          color: colors.primarySoft,
          fontSize: fontSize.sm,
          fontWeight: weight.bold,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
        balanceValueRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        balanceValue: {
          flex: 1,
          color: colors.white,
          fontSize: fontSize.hero,
          fontWeight: weight.black,
          letterSpacing: -1,
          lineHeight: 50,
        },
        eyeBtn: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -6,
          marginRight: -10,
        },

        accountsWrap: { marginTop: -CARD_HEIGHT / 2, marginBottom: spacing.md },
        accountsContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
        accountCard: {
          width: 178,
          height: CARD_HEIGHT,
          backgroundColor: colors.surface,
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
        accountTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        accountName: {
          fontSize: fontSize.sm,
          color: colors.textPrimary,
          fontWeight: weight.bold,
          flexShrink: 1,
        },
        accountTypePill: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radius.xs,
          backgroundColor: colors.primarySoft,
        },
        accountTypeText: {
          fontSize: 9,
          fontWeight: weight.heavy,
          color: colors.primary,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
        accountBalance: {
          fontSize: fontSize.md,
          color: colors.textPrimary,
          fontWeight: weight.heavy,
          letterSpacing: -0.3,
          marginTop: 2,
        },
        accountIconWrap: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        accountEmpty: {
          marginHorizontal: spacing.lg,
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        },
        accountEmptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
        adjustHint: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.sm,
        },
        adjustHintText: { fontSize: fontSize.xs, color: colors.textMuted },

        body: { paddingHorizontal: spacing.lg, gap: spacing.md },
        statsRow: { flexDirection: 'row', gap: spacing.md },
        netCard: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        netLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        netLabel: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: weight.semibold },
        netValue: { fontSize: fontSize.lg, fontWeight: weight.heavy },
      }),
    [colors, insets.bottom],
  );

  const accountCards = useMemo(
    () =>
      accounts.map((acc) => ({
        ...acc,
        currentBalance: balances.get(acc.id) ?? acc.startingBalance,
      })),
    [accounts, balances],
  );

  return (
    <Screen>
      <TopBar title={t('tabs.dashboard')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.balanceLabelRow}>
            <Wallet size={14} color={colors.primarySoft} />
            <Text style={styles.balanceLabel}>{t('dashboard.totalBalance')}</Text>
          </View>
          <View style={styles.balanceValueRow}>
            {hydrated ? (
              <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
                {mask(totalBalance)}
              </Text>
            ) : (
              <Skeleton width="70%" height={40} radius={12} style={{ marginVertical: 4 }} />
            )}
            <Pressable
              onPress={toggleHidden}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={hidden ? t('dashboard.showBalance') : t('dashboard.hideBalance')}
            >
              {hidden ? <EyeClosed size={18} color={colors.white} /> : <Eye size={18} color={colors.white} />}
            </Pressable>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.accountsWrap}>
            {!hydrated ? (
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SkeletonCard lines={2} height={CARD_HEIGHT} />
              </View>
            ) : accountCards.length === 0 ? (
              <View style={styles.accountEmpty}>
                <Text style={styles.accountEmptyText}>{t('dashboard.noAccounts')}</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.accountsContent}
              >
                {accountCards.map((item) => {
                  const type = findAccountType(item.typeId);
                  const TypeIcon = type.icon;
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [styles.accountCard, pressed && { transform: [{ scale: 0.97 }] }]}
                      onPress={() =>
                        router.push({ pathname: '/account-detail', params: { accountId: item.id, period } })
                      }
                      // Long-press is the two-tap path to a balance correction.
                      onLongPress={() => openAdjust(item)}
                      delayLongPress={350}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, ${mask(item.currentBalance)}`}
                      accessibilityHint={t('adjust.openHint')}
                    >
                      <View style={styles.accountIconWrap}>
                        <TypeIcon size={16} color={colors.primary} />
                      </View>
                      <View style={styles.accountMain}>
                        <View style={styles.accountTitleRow}>
                          <Text style={styles.accountName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={styles.accountTypePill}>
                            <Text style={styles.accountTypeText}>
                              {tBuiltin(t, 'accountTypes', type.id)}
                            </Text>
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

          {accountCards.length > 0 ? (
            <View style={styles.adjustHint}>
              <Scale size={12} color={colors.textMuted} />
              <Text style={styles.adjustHintText}>{t('adjust.openHint')}</Text>
            </View>
          ) : null}

          <View style={styles.body}>
            <SectionHeader title={t('dashboard.cashflow')} />
            <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />

            <View style={styles.statsRow}>
              <StatTile
                label={t('type.income')}
                value={formatIDR(totals.income)}
                Icon={TrendingUp}
                tone="income"
              />
              <StatTile
                label={t('type.expense')}
                value={formatIDR(totals.expense)}
                Icon={TrendingDown}
                tone="expense"
              />
            </View>

            <Card padded={false} style={{ padding: spacing.md }}>
              <View style={styles.netCard}>
                <View style={styles.netLeft}>
                  <ArrowRightLeft size={16} color={colors.textSecondary} />
                  <Text style={styles.netLabel}>
                    {t('dashboard.netFlow', { period: tPeriod(t, period) })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.netValue,
                    { color: totals.net >= 0 ? colors.income : colors.expense },
                  ]}
                >
                  {`${totals.net >= 0 ? '+' : '-'}${formatIDR(Math.abs(totals.net))}`}
                </Text>
              </View>
            </Card>

            <StreakCard current={streak.current} longest={streak.longest} />

            {byCategory.length > 0 ? (
              <>
                <SectionHeader
                  title={t('dashboard.topCategories')}
                  action={{ label: t('report.title'), onPress: () => router.push('/report') }}
                />
                <TopCategoriesRow
                  data={byCategory}
                  total={totals.expense}
                  onPress={(categoryId) =>
                    router.push({ pathname: '/category-detail', params: { categoryId, period } })
                  }
                />
                <PieChartCard data={byCategory} total={totals.expense} />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />

      <AdjustBalanceSheet
        visible={!!adjustTarget}
        account={adjustTarget}
        onClose={() => setAdjustTarget(null)}
      />
    </Screen>
  );
}
