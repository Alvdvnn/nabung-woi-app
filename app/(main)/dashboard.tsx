import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRightLeft,
  Eye,
  EyeClosed,
  PiggyBank,
  Plus,
  Repeat,
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
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import PieChartCard from '../../components/charts/PieChartCard';
import StreakCard from '../../components/dashboard/StreakCard';
import TopCategoriesRow from '../../components/dashboard/TopCategoriesRow';
import RangeFilter, { RangePreset, rangeForPreset } from '../../components/dashboard/RangeFilter';
import PaceCard from '../../components/dashboard/PaceCard';
import BudgetsCard from '../../components/dashboard/BudgetsCard';
import QuickAddRow, { quickAddCandidates } from '../../components/dashboard/QuickAddRow';
import BackupNudge from '../../components/dashboard/BackupNudge';
import AdjustBalanceSheet from '../../components/account/AdjustBalanceSheet';
import WhatsNewSheet from '../../components/feedback/WhatsNewSheet';
import { useStreak } from '../../hooks/useStreak';
import { hapticMedium } from '../../utils/haptics';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { WHATS_NEW_VERSION } from '../../constants/version';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { usePrefs } from '../../context/PrefsContext';
import { Account, getBalanceHidden, getWhatsNewSeen, setBalanceHidden, setWhatsNewSeen } from '../../utils/storage';
import { formatIDR, formatIDRCompact } from '../../utils/format';
import { findAccountType } from '../../constants/accountTypes';
import { useLocale, useT } from '../../i18n';
import { DICTS } from '../../i18n/dicts';
import { tBuiltin } from '../../i18n/labels';
import { DateRange, rangeToParams } from '../../utils/period';
import { buildReport } from '../../utils/report';
import { useRangeLabel } from '../../components/report/RangeNav';

const CARD_HEIGHT = 76;
const MASKED = 'Rp ******';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const { locale } = useLocale();

  const { txs, accounts, balances, totalBalance, hydrated } = useData();
  const { budgetsByCategory, hydrated: prefsHydrated } = usePrefs();
  const [preset, setPreset] = useState<RangePreset>('month');
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('month'));
  const [hidden, setHidden] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);
  const [whatsNew, setWhatsNew] = useState(false);
  const rangeLabel = useRangeLabel(range);

  useEffect(() => {
    getBalanceHidden().then(setHidden);
  }, []);

  // Release notes, once per version, after the data is on screen.
  useEffect(() => {
    if (!hydrated || !prefsHydrated) return;
    getWhatsNewSeen().then((seen) => {
      if (seen !== WHATS_NEW_VERSION) setWhatsNew(true);
    });
  }, [hydrated, prefsHydrated]);

  const closeWhatsNew = useCallback(() => {
    setWhatsNew(false);
    setWhatsNewSeen(WHATS_NEW_VERSION).catch(() => {});
  }, []);

  const toggleHidden = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      setBalanceHidden(next);
      return next;
    });
  }, []);

  const mask = useCallback((value: number) => (hidden ? MASKED : formatIDR(value)), [hidden]);

  const monthNames = DICTS[locale].calendar.months;
  const report = useMemo(
    () => buildReport({ txs, accounts, range, monthNames, budgets: budgetsByCategory }),
    [txs, accounts, range, monthNames, budgetsByCategory],
  );
  const quickAdd = useMemo(() => quickAddCandidates(txs), [txs]);
  const streak = useStreak(txs);

  const onRangeChange = useCallback((p: RangePreset, r: DateRange) => {
    setPreset(p);
    setRange(r);
  }, []);

  const openAdjust = useCallback((account: Account) => {
    hapticMedium();
    setAdjustTarget(account);
  }, []);

  const openCategory = useCallback(
    (categoryId: string) => router.push({ pathname: '/category-detail', params: { categoryId, ...rangeToParams(range) } }),
    [router, range],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { paddingBottom: contentBottomForFab(insets.bottom) },
        hero: {
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
          color: colors.onPrimary,
          opacity: 0.85,
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
          color: colors.onPrimary,
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
        accountsWrap: { marginTop: -CARD_HEIGHT / 2, marginBottom: spacing.sm },
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
        accountName: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: weight.bold, flexShrink: 1 },
        accountTypePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs, backgroundColor: colors.primarySoft },
        accountTypeText: { fontSize: 9, fontWeight: weight.heavy, color: colors.primary, letterSpacing: 0.8, textTransform: 'uppercase' },
        accountBalance: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: weight.heavy, letterSpacing: -0.3, marginTop: 2 },
        accountIconWrap: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
        accountEmpty: {
          marginHorizontal: spacing.lg,
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          gap: spacing.sm,
        },
        accountEmptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
        accountEmptyLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: weight.bold },
        adjustHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
        adjustHintText: { fontSize: fontSize.xs, color: colors.textMuted },
        body: { paddingHorizontal: spacing.lg, gap: spacing.md },
        statsRow: { flexDirection: 'row', gap: spacing.md },
        netCard: { gap: spacing.xs },
        netTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
        netLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        netLabel: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: weight.semibold },
        netValue: { fontSize: fontSize.lg, fontWeight: weight.heavy },
        compare: { fontSize: fontSize.xs, color: colors.textMuted },
      }),
    [colors, insets.bottom],
  );

  const accountCards = useMemo(
    () => accounts.map((acc) => ({ ...acc, currentBalance: balances.get(acc.id) ?? acc.startingBalance })),
    [accounts, balances],
  );

  const net = report.totals.net;
  const prevNet = report.previousTotals.net;
  const compareText =
    report.previousTotals.income === 0 && report.previousTotals.expense === 0
      ? t('compare.noPrevious')
      : net >= prevNet
        ? t('compare.betterBy', { n: formatIDRCompact(net - prevNet) })
        : t('compare.worseBy', { n: formatIDRCompact(prevNet - net) });

  return (
    <Screen>
      <TopBar title={t('tabs.dashboard')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* primaryLight is left out: onPrimary fails AA on it in most light palettes. */}
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.balanceLabelRow}>
            <Wallet size={14} color={colors.onPrimary} />
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
              {hidden ? <EyeClosed size={18} color={colors.onPrimary} /> : <Eye size={18} color={colors.onPrimary} />}
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.accountsWrap}>
            {!hydrated ? (
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SkeletonCard lines={2} height={CARD_HEIGHT} />
              </View>
            ) : accountCards.length === 0 ? (
              <Pressable style={styles.accountEmpty} onPress={() => router.push('/settings/accounts')} accessibilityRole="button">
                <Text style={styles.accountEmptyText}>{t('dashboard.noAccounts')}</Text>
                <Text style={styles.accountEmptyLink}>{t('account.add')}</Text>
              </Pressable>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsContent}>
                {accountCards.map((item) => {
                  const type = findAccountType(item.typeId);
                  const TypeIcon = type.icon;
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [styles.accountCard, pressed && { transform: [{ scale: 0.97 }] }]}
                      onPress={() => router.push({ pathname: '/account-detail', params: { accountId: item.id, ...rangeToParams(range) } })}
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

          {accountCards.length > 0 ? (
            <View style={styles.adjustHint}>
              <Scale size={12} color={colors.textMuted} />
              <Text style={styles.adjustHintText}>{t('adjust.openHint')}</Text>
            </View>
          ) : null}

          <View style={styles.body}>
            <BackupNudge />

            <SectionHeader title={t('dashboard.cashflow')} subtitle={rangeLabel} />
            <RangeFilter preset={preset} range={range} onChange={onRangeChange} />

            <View style={styles.statsRow}>
              <StatTile
                label={t('type.income')}
                value={mask(report.totals.income)}
                Icon={TrendingUp}
                tone="income"
                trend={{ percent: report.deltas.income.percent, goodWhen: 'up' }}
                caption={t('report.vsPrevious')}
              />
              <StatTile
                label={t('type.expense')}
                value={mask(report.totals.expense)}
                Icon={TrendingDown}
                tone="expense"
                trend={{ percent: report.deltas.expense.percent, goodWhen: 'down' }}
                caption={t('report.vsPrevious')}
              />
            </View>

            <Card padded={false} style={{ padding: spacing.md }}>
              <View style={styles.netCard}>
                <View style={styles.netTop}>
                  <View style={styles.netLeft}>
                    <ArrowRightLeft size={16} color={colors.textSecondary} />
                    <Text style={styles.netLabel}>{t('dashboard.netFlowShort')}</Text>
                  </View>
                  <Text style={[styles.netValue, { color: net >= 0 ? colors.income : colors.expense }]}>
                    {hidden ? MASKED : `${net >= 0 ? '+' : '-'}${formatIDR(Math.abs(net))}`}
                  </Text>
                </View>
                <Text style={styles.compare}>{compareText}</Text>
              </View>
            </Card>

            {report.pace && report.pace.spent > 0 && !hidden ? (
              <PaceCard pace={report.pace} previousExpense={report.previousTotals.expense} />
            ) : null}

            {report.budgets.length > 0 ? (
              <>
                <SectionHeader
                  title={t('settings.budgets')}
                  Icon={PiggyBank}
                  action={{ label: t('dashboard.seeAll'), onPress: () => router.push('/settings/budgets') }}
                />
                <BudgetsCard budgets={report.budgets} onPressCategory={openCategory} />
              </>
            ) : null}

            {quickAdd.length > 0 ? (
              <>
                <SectionHeader title={t('quickAdd.title')} subtitle={t('quickAdd.sub')} Icon={Repeat} />
                <QuickAddRow
                  items={quickAdd}
                  onPress={(item) =>
                    router.push({
                      pathname: '/',
                      params: {
                        type: item.type,
                        amount: String(item.amount),
                        categoryId: item.categoryId,
                        accountId: item.accountId,
                        note: item.note,
                        returnTo: 'dashboard',
                      },
                    })
                  }
                />
              </>
            ) : null}

            {report.expenseByCategory.length > 0 ? (
              <>
                <SectionHeader title={t('dashboard.topCategories')} action={{ label: t('report.title'), onPress: () => router.push('/report') }} />
                <TopCategoriesRow data={report.expenseByCategory} total={report.totals.expense} onPress={openCategory} />
                <PieChartCard data={report.expenseByCategory} total={report.totals.expense} />
              </>
            ) : null}

            <StreakCard current={streak.current} longest={streak.longest} />
          </View>
        </View>
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} accessibilityLabel={t('input.headingAdd')} />

      <AdjustBalanceSheet visible={!!adjustTarget} account={adjustTarget} onClose={() => setAdjustTarget(null)} />
      <WhatsNewSheet visible={whatsNew} onClose={closeWhatsNew} />
    </Screen>
  );
}
