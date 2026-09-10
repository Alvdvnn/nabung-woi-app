import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CircleAlert, Inbox, Scale } from 'lucide-react-native';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import Button from '../components/ui/Button';
import EmptyState from '../components/feedback/EmptyState';
import TransactionItem, { TRANSACTION_ITEM_HEIGHT } from '../components/transaction/TransactionItem';
import AdjustBalanceSheet from '../components/account/AdjustBalanceSheet';
import { useTheme } from '../hooks/useTheme';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { tBuiltin } from '../i18n/labels';
import { fontSize, radius, spacing, weight } from '../constants/theme';
import { Transaction } from '../utils/storage';
import { adjustmentTotals, filterByPeriod, Period, totalsOf } from '../utils/aggregate';
import { findAccountType } from '../constants/accountTypes';
import { formatIDR } from '../utils/format';

export default function AccountDetailScreen() {
  const { colors } = useTheme();
  const t = useT();
  const [adjustOpen, setAdjustOpen] = useState(false);

  const params = useLocalSearchParams<{ accountId?: string; period?: Period }>();
  const accountId = params.accountId ?? '';
  const period: Period = (params.period as Period) ?? 'month';

  const { txs, accountsById, balances, hydrated } = useData();
  const account = accountsById.get(accountId);

  const periodLabel =
    period === 'day' ? t('period.today') : period === 'year' ? t('period.thisYear') : t('period.thisMonth');

  // Transfers into this account belong here too, not just rows it paid for.
  const accountTxs = useMemo(
    () => txs.filter((tx) => tx.accountId === accountId || tx.toAccountId === accountId),
    [txs, accountId],
  );
  const periodTxs = useMemo(() => filterByPeriod(accountTxs, period), [accountTxs, period]);
  const periodTotals = useMemo(() => totalsOf(periodTxs), [periodTxs]);
  const periodAdjustments = useMemo(() => adjustmentTotals(periodTxs), [periodTxs]);

  const currentBalance = account ? balances.get(account.id) ?? account.startingBalance : 0;
  const accountType = findAccountType(account?.typeId ?? '');
  const TypeIcon = accountType.icon;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        },
        heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        heroIcon: {
          width: 46,
          height: 46,
          borderRadius: radius.full,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroName: { fontSize: fontSize.xl, fontWeight: weight.heavy, color: colors.white },
        heroType: { fontSize: fontSize.xs, color: colors.primarySoft, fontWeight: weight.semibold, marginTop: 2 },
        balanceLabel: {
          fontSize: fontSize.xs,
          color: colors.primarySoft,
          fontWeight: weight.bold,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        balanceValue: {
          fontSize: fontSize.display,
          fontWeight: weight.black,
          color: colors.white,
          letterSpacing: -0.8,
        },
        statsRow: { flexDirection: 'row', gap: spacing.xl },
        statCell: { gap: 2 },
        statLabel: { fontSize: fontSize.xs, color: colors.primarySoft },
        statValue: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.white },
        section: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        sectionTitle: {
          fontSize: fontSize.sm,
          fontWeight: weight.heavy,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
        sectionMeta: { fontSize: fontSize.xs, color: colors.textMuted },
        adjustNote: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.md,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.adjustmentLight,
        },
        adjustNoteText: { fontSize: fontSize.xs, color: colors.adjustment },
        list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
      }),
    [colors],
  );

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem item={item} accountName={accountsById.get(item.accountId)?.name} />
    ),
    [accountsById],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Transaction> | null | undefined, index: number) => ({
      length: TRANSACTION_ITEM_HEIGHT,
      offset: TRANSACTION_ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  if (hydrated && !account) {
    return (
      <Screen>
        <TopBar title={t('accountDetail.fallbackTitle')} showBack showLogo={false} showActions={false} />
        <EmptyState
          Icon={CircleAlert}
          title={t('accountDetail.notFound')}
          subtitle={t('accountDetail.notFoundSub')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={t('accountDetail.fallbackTitle')} showBack showLogo={false} showActions={false} />

      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <TypeIcon size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName} numberOfLines={1}>
              {account?.name ?? t('common.unknownAccount')}
            </Text>
            <Text style={styles.heroType}>{tBuiltin(t, 'accountTypes', accountType.id)}</Text>
          </View>
          <Button
            label={t('adjust.cta')}
            Icon={Scale}
            variant="secondary"
            size="sm"
            onPress={() => setAdjustOpen(true)}
          />
        </View>

        <View>
          <Text style={styles.balanceLabel}>{t('accountDetail.currentBalance')}</Text>
          <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatIDR(currentBalance)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{`${t('type.income')} · ${periodLabel}`}</Text>
            <Text style={styles.statValue}>{formatIDR(periodTotals.income)}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{`${t('type.expense')} · ${periodLabel}`}</Text>
            <Text style={styles.statValue}>{formatIDR(periodTotals.expense)}</Text>
          </View>
        </View>
      </View>

      {periodAdjustments.count > 0 ? (
        <View style={styles.adjustNote}>
          <Text style={styles.adjustNoteText}>
            {`${t('report.adjustments')}: ${t('report.adjustmentsSummary', {
              in: formatIDR(periodAdjustments.in),
              out: formatIDR(periodAdjustments.out),
            })} · ${t('common.notCounted')}`}
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('accountDetail.entriesLabel')}</Text>
        <Text style={styles.sectionMeta}>
          {`${periodTxs.length} ${periodTxs.length === 1 ? t('accountDetail.entry') : t('accountDetail.entries')} · ${periodLabel}`}
        </Text>
      </View>

      {periodTxs.length === 0 ? (
        <EmptyState
          Icon={Inbox}
          title={t('accountDetail.noEntries')}
          subtitle={t('accountDetail.noEntriesSub', {
            name: account?.name ?? t('accountDetail.thisAccount'),
          })}
        />
      ) : (
        <FlatList
          data={periodTxs}
          keyExtractor={(tx) => tx.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          windowSize={9}
          removeClippedSubviews
        />
      )}

      <AdjustBalanceSheet
        visible={adjustOpen}
        account={account ?? null}
        onClose={() => setAdjustOpen(false)}
      />
    </Screen>
  );
}
