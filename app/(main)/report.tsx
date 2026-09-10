import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  BarChart3,
  CalendarRange,
  Flame,
  Plus,
  Receipt,
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
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/feedback/EmptyState';
import TrendChart from '../../components/charts/TrendChart';
import CategoryBars from '../../components/charts/CategoryBars';
import RangeNav from '../../components/report/RangeNav';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { useStreak } from '../../hooks/useStreak';
import { useCategories } from '../../context/CategoriesContext';
import { useLocale, useT } from '../../i18n';
import { DICTS } from '../../i18n/dicts';
import { Granularity, DateRange, rangeFor, shiftRange } from '../../utils/period';
import { buildReport } from '../../utils/report';
import { findAccountType } from '../../constants/accountTypes';
import { formatDate, formatIDR, formatIDRCompact } from '../../utils/format';
import { parseIsoDay } from '../../utils/date';

type CategoryMode = 'expense' | 'income';

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const { locale } = useLocale();
  const { txs, accounts, hydrated } = useData();
  const { find } = useCategories();

  const [range, setRange] = useState<DateRange>(() => rangeFor('month'));
  const [categoryMode, setCategoryMode] = useState<CategoryMode>('expense');
  const streak = useStreak(txs);

  const monthNames = DICTS[locale].calendar.months;

  const report = useMemo(
    () => buildReport({ txs, accounts, range, monthNames }),
    [txs, accounts, range, monthNames],
  );

  const granularityOptions = useMemo<Segment<Granularity>[]>(
    () => [
      { id: 'day', label: t('period.day') },
      { id: 'week', label: t('period.week') },
      { id: 'month', label: t('period.month') },
      { id: 'year', label: t('period.year') },
    ],
    [t],
  );

  const categoryOptions = useMemo<Segment<CategoryMode>[]>(
    () => [
      { id: 'expense', label: t('type.expense'), activeColor: colors.expense },
      { id: 'income', label: t('type.income'), activeColor: colors.income },
    ],
    [t, colors],
  );

  const changeGranularity = useCallback((g: Granularity) => setRange(rangeFor(g)), []);
  const shift = useCallback((dir: 1 | -1) => setRange((r) => shiftRange(r, dir)), []);
  const jumpToNow = useCallback(() => setRange((r) => rangeFor(r.granularity)), []);

  const openCategory = useCallback(
    (categoryId: string) => {
      // Detail screens speak in day/month/year; a week maps closest to a month.
      const period = range.granularity === 'week' ? 'month' : range.granularity;
      router.push({ pathname: '/category-detail', params: { categoryId, period } });
    },
    [router, range.granularity],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: contentBottomForFab(insets.bottom),
        },
        controls: { gap: spacing.sm },
        tiles: { flexDirection: 'row', gap: spacing.md },
        verdict: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        verdictText: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary },
        netValue: { fontSize: fontSize.xxl, fontWeight: weight.black, letterSpacing: -0.6 },
        netLabel: {
          fontSize: fontSize.xs,
          fontWeight: weight.bold,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
        metaCell: { minWidth: 96, gap: 2 },
        metaLabel: { fontSize: fontSize.xs, color: colors.textMuted },
        metaValue: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        accountRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
        },
        accountIcon: {
          width: 34,
          height: 34,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        accountMain: { flex: 1 },
        accountName: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textPrimary },
        accountMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        accountRight: { alignItems: 'flex-end' },
        accountBalance: { fontSize: fontSize.sm, fontWeight: weight.heavy, color: colors.textPrimary },
        txRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
        },
        rank: {
          width: 22,
          height: 22,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rankText: { fontSize: 10, fontWeight: weight.heavy, color: colors.textSecondary },
        txMain: { flex: 1 },
        txTitle: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textPrimary },
        txMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        txAmount: { fontSize: fontSize.sm, fontWeight: weight.heavy, color: colors.expense },
        adjustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        adjustIcon: {
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: colors.adjustmentLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        adjustMain: { flex: 1 },
        adjustTitle: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textPrimary },
        adjustHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        adjustValue: { fontSize: fontSize.md, fontWeight: weight.heavy, color: colors.adjustment },
      }),
    [colors, insets.bottom],
  );

  if (!hydrated) {
    return (
      <Screen>
        <TopBar title={t('report.title')} showLogo={false} />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonCard lines={1} height={56} />
          <SkeletonCard lines={2} height={110} />
          <SkeletonCard lines={3} height={180} />
        </View>
      </Screen>
    );
  }

  const netTone = report.totals.net > 0 ? colors.income : report.totals.net < 0 ? colors.expense : colors.textSecondary;
  const verdict =
    report.totals.net > 0
      ? t('report.netPositive')
      : report.totals.net < 0
        ? t('report.netNegative')
        : t('report.netFlat');

  const categoryData = categoryMode === 'expense' ? report.expenseByCategory : report.incomeByCategory;
  const categoryTotal = categoryMode === 'expense' ? report.totals.expense : report.totals.income;

  return (
    <Screen>
      <TopBar title={t('report.title')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.controls}>
          <SegmentedControl
            options={granularityOptions}
            value={range.granularity}
            onChange={changeGranularity}
          />
          <RangeNav range={range} onShift={shift} onPressLabel={jumpToNow} />
        </View>

        {report.isEmpty ? (
          <Card padded>
            <EmptyState
              Icon={CalendarRange}
              title={t('report.empty')}
              subtitle={t('report.emptySub')}
              action={{ label: t('input.headingAdd'), onPress: () => router.push({ pathname: '/', params: { returnTo: 'report' } }) }}
            />
          </Card>
        ) : (
          <>
            <View style={styles.tiles}>
              <StatTile
                label={t('type.income')}
                value={formatIDR(report.totals.income)}
                Icon={TrendingUp}
                tone="income"
                trend={{ percent: report.deltas.income.percent, goodWhen: 'up' }}
                caption={t('report.vsPrevious')}
              />
              <StatTile
                label={t('type.expense')}
                value={formatIDR(report.totals.expense)}
                Icon={TrendingDown}
                tone="expense"
                trend={{ percent: report.deltas.expense.percent, goodWhen: 'down' }}
                caption={t('report.vsPrevious')}
              />
            </View>

            <Card>
              <Text style={styles.netLabel}>{t('dashboard.cashflow')}</Text>
              <Text style={[styles.netValue, { color: netTone }]} numberOfLines={1} adjustsFontSizeToFit>
                {`${report.totals.net >= 0 ? '+' : '-'}${formatIDR(Math.abs(report.totals.net))}`}
              </Text>
              <View style={styles.verdict}>
                <Activity size={16} color={colors.textMuted} />
                <Text style={styles.verdictText}>{verdict}</Text>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('report.savingsRate')}</Text>
                  <Text style={styles.metaValue}>
                    {report.savingsRate === null ? '—' : `${Math.round(report.savingsRate)}%`}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{`${t('report.perDay')} · ${t('type.expense')}`}</Text>
                  <Text style={styles.metaValue}>{formatIDRCompact(report.avgExpensePerDay)}</Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{`${t('report.perDay')} · ${t('type.income')}`}</Text>
                  <Text style={styles.metaValue}>{formatIDRCompact(report.avgIncomePerDay)}</Text>
                </View>
              </View>
            </Card>

            <SectionHeader title={t('report.trend')} Icon={BarChart3} />
            <Card>
              <TrendChart
                buckets={report.buckets}
                incomeLabel={t('type.income')}
                expenseLabel={t('type.expense')}
              />
            </Card>

            <SectionHeader title={t('report.byCategory')} Icon={Receipt} />
            <Card>
              <SegmentedControl
                options={categoryOptions}
                value={categoryMode}
                onChange={setCategoryMode}
                style={{ marginBottom: spacing.sm }}
              />
              <CategoryBars
                data={categoryData}
                total={categoryTotal}
                onPress={openCategory}
                emptyLabel={categoryMode === 'expense' ? t('report.noExpenses') : t('report.noIncome')}
              />
            </Card>

            {report.byAccount.length > 0 ? (
              <>
                <SectionHeader title={t('report.byAccount')} Icon={Wallet} />
                <Card>
                  {report.byAccount.map((acc) => {
                    const TypeIcon = findAccountType(acc.typeId).icon;
                    return (
                      <Pressable
                        key={acc.accountId}
                        style={styles.accountRow}
                        accessibilityRole="button"
                        accessibilityLabel={acc.name}
                        onPress={() =>
                          router.push({
                            pathname: '/account-detail',
                            params: {
                              accountId: acc.accountId,
                              period: range.granularity === 'week' ? 'month' : range.granularity,
                            },
                          })
                        }
                      >
                        <View style={styles.accountIcon}>
                          <TypeIcon size={16} color={colors.primary} />
                        </View>
                        <View style={styles.accountMain}>
                          <Text style={styles.accountName} numberOfLines={1}>
                            {acc.name}
                          </Text>
                          <Text style={styles.accountMeta}>
                            {`${t('type.expense')} ${formatIDRCompact(acc.expense)} · ${t('type.income')} ${formatIDRCompact(acc.income)}`}
                          </Text>
                        </View>
                        <View style={styles.accountRight}>
                          <Text style={styles.accountBalance}>{formatIDRCompact(acc.balance)}</Text>
                          <Text style={styles.accountMeta}>{t('report.balanceNow')}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </Card>
              </>
            ) : null}

            {report.topExpenses.length > 0 ? (
              <>
                <SectionHeader title={t('report.topExpenses')} Icon={TrendingDown} />
                <Card>
                  {report.topExpenses.map((tx, i) => (
                    <Pressable
                      key={tx.id}
                      style={styles.txRow}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/', params: { id: tx.id, returnTo: 'report' } })}
                    >
                      <View style={styles.rank}>
                        <Text style={styles.rankText}>{i + 1}</Text>
                      </View>
                      <View style={styles.txMain}>
                        <Text style={styles.txTitle} numberOfLines={1}>
                          {find(tx.categoryId)?.name ?? t('common.other')}
                        </Text>
                        <Text style={styles.txMeta} numberOfLines={1}>
                          {[formatDate(tx.date), tx.note].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <Text style={styles.txAmount}>{formatIDR(tx.amount)}</Text>
                    </Pressable>
                  ))}
                </Card>
              </>
            ) : null}

            <SectionHeader title={t('report.habits')} Icon={Flame} />
            <Card>
              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('report.txCount')}</Text>
                  <Text style={styles.metaValue}>{report.txCount}</Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('report.daysLogged')}</Text>
                  <Text style={styles.metaValue}>
                    {t('report.daysLoggedOf', { n: report.daysLogged, total: report.daysInRange })}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('report.perTx')}</Text>
                  <Text style={styles.metaValue}>{formatIDRCompact(report.avgExpensePerTx)}</Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('report.busiestDay')}</Text>
                  <Text style={styles.metaValue}>
                    {report.busiestDay
                      ? `${formatDate(parseIsoDay(report.busiestDay.dayKey).toISOString())} · ${formatIDRCompact(report.busiestDay.total)}`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('streak.dayStreak').trim()}</Text>
                  <Text style={styles.metaValue}>{streak.current}</Text>
                </View>
              </View>
            </Card>

            {report.adjustments.count > 0 ? (
              <>
                <SectionHeader title={t('report.adjustments')} Icon={Scale} />
                <Card>
                  <View style={styles.adjustRow}>
                    <View style={styles.adjustIcon}>
                      <Scale size={18} color={colors.adjustment} />
                    </View>
                    <View style={styles.adjustMain}>
                      <Text style={styles.adjustTitle}>
                        {t('report.adjustmentsSummary', {
                          in: formatIDRCompact(report.adjustments.in),
                          out: formatIDRCompact(report.adjustments.out),
                        })}
                      </Text>
                      <Text style={styles.adjustHint}>{t('report.adjustmentsHint')}</Text>
                    </View>
                    <Text style={styles.adjustValue}>
                      {`${report.adjustments.net >= 0 ? '+' : '-'}${formatIDRCompact(Math.abs(report.adjustments.net))}`}
                    </Text>
                  </View>
                </Card>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <Fab
        Icon={Plus}
        bottom={fabBottomForTabScreen(insets.bottom)}
        onPress={() => router.push({ pathname: '/', params: { returnTo: 'report' } })}
      />
    </Screen>
  );
}
