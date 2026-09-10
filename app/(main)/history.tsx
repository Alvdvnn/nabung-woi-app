import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, Plus, SlidersHorizontal } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import Card from '../../components/ui/Card';
import SegmentedControl, { Segment } from '../../components/ui/SegmentedControl';
import FilterChips, { FilterOption } from '../../components/ui/FilterChips';
import Sheet from '../../components/ui/Sheet';
import { SkeletonCard } from '../../components/ui/Skeleton';
import TransactionItem, { TRANSACTION_ITEM_HEIGHT } from '../../components/transaction/TransactionItem';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import RangeNav from '../../components/report/RangeNav';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { useDeleteWithUndo } from '../../hooks/useTransactionActions';
import { Transaction, TransactionType, getHistoryPrefs, setHistoryPrefs } from '../../utils/storage';
import { useT } from '../../i18n';
import { DateRange, Granularity, rangeFor, shiftRange } from '../../utils/period';
import { isoDay } from '../../utils/date';
import { adjustmentTotals, filterByRange, totalsOf } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';

type Filter = 'all' | TransactionType;

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();

  const { txs, accountsById, hydrated } = useData();
  const deleteWithUndo = useDeleteWithUndo();

  const [filter, setFilter] = useState<Filter>('all');
  const [range, setRange] = useState<DateRange>(() => rangeFor('month'));
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const prefsLoaded = useRef(false);

  // Load persisted filter + period on mount.
  useEffect(() => {
    getHistoryPrefs().then((p) => {
      if (p) {
        setFilter(p.filter);
        setRange(rangeFor(p.period));
      }
      prefsLoaded.current = true;
    });
  }, []);

  // Persist after each change (skip the initial render before load completes).
  useEffect(() => {
    if (!prefsLoaded.current) return;
    setHistoryPrefs({ filter, period: range.granularity });
  }, [filter, range.granularity]);

  // If the calendar day rolled over while the app sat in the background, a day
  // view that was showing "today" follows along. A day the user deliberately
  // navigated to is left alone.
  const lastTodayKey = useRef(isoDay(new Date()));
  useFocusEffect(
    useCallback(() => {
      const todayKey = isoDay(new Date());
      if (todayKey === lastTodayKey.current) return;
      const wasOnToday = range.granularity === 'day' && range.startKey === lastTodayKey.current;
      lastTodayKey.current = todayKey;
      if (wasOnToday) setRange(rangeFor('day'));
    }, [range]),
  );

  const filterOptions = useMemo<FilterOption<Filter>[]>(
    () => [
      { id: 'all', label: t('common.all') },
      { id: 'income', label: t('type.income'), activeColor: colors.income },
      { id: 'expense', label: t('type.expense'), activeColor: colors.expense },
      { id: 'transfer', label: t('type.transfer'), activeColor: colors.transfer },
      { id: 'adjustment', label: t('type.adjustment'), activeColor: colors.adjustment },
    ],
    [t, colors],
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

  const txsInRange = useMemo(() => filterByRange(txs, range), [txs, range]);
  const periodTotals = useMemo(() => totalsOf(txsInRange), [txsInRange]);
  const periodAdjustments = useMemo(() => adjustmentTotals(txsInRange), [txsInRange]);

  const filtered = useMemo(
    () => (filter === 'all' ? txsInRange : txsInRange.filter((tx) => tx.type === filter)),
    [txsInRange, filter],
  );

  const keyExtractor = useCallback((tx: Transaction) => tx.id, []);
  const handleDelete = useCallback((id: string) => setPendingDeleteId(id), []);
  const handlePressItem = useCallback(
    (id: string) => router.push({ pathname: '/', params: { id, returnTo: 'history' } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem
        item={item}
        accountName={accountsById.get(item.accountId)?.name}
        onDelete={handleDelete}
        onPress={handlePressItem}
      />
    ),
    [accountsById, handleDelete, handlePressItem],
  );

  // Rows are a fixed height, so FlatList can skip measuring them entirely.
  const getItemLayout = useCallback(
    (_: ArrayLike<Transaction> | null | undefined, index: number) => ({
      length: TRANSACTION_ITEM_HEIGHT,
      offset: TRANSACTION_ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteWithUndo(id);
  }, [pendingDeleteId, deleteWithUndo]);

  const addForRange = useCallback(() => {
    // On a day view the add form opens on that day; on wider ranges it opens on
    // today, which is what the user almost always means.
    const params = range.granularity === 'day'
      ? { date: range.startKey, returnTo: 'history' }
      : { returnTo: 'history' };
    router.push({ pathname: '/', params });
  }, [router, range]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
        navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        navMain: { flex: 1 },
        filterBtn: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        filterBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
        summary: { flexDirection: 'row', gap: spacing.md },
        summaryCell: { flex: 1, gap: 2 },
        summaryLabel: {
          fontSize: fontSize.xs,
          color: colors.textMuted,
          fontWeight: weight.semibold,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        summaryValue: { fontSize: fontSize.md, fontWeight: weight.heavy },
        list: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: contentBottomForFab(insets.bottom),
        },
        sheetLabel: {
          fontSize: fontSize.xs,
          color: colors.textSecondary,
          fontWeight: weight.bold,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        adjustNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
      }),
    [colors, insets.bottom],
  );

  return (
    <Screen>
      <TopBar title={t('history.title')} showLogo={false} />

      <View style={styles.header}>
        <View style={styles.navRow}>
          <View style={styles.navMain}>
            <RangeNav
              range={range}
              onShift={(dir) => setRange((r) => shiftRange(r, dir))}
              onPressLabel={() => setRange((r) => rangeFor(r.granularity))}
            />
          </View>
          <Pressable
            onPress={() => setFiltersOpen(true)}
            style={[styles.filterBtn, filter !== 'all' && styles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={t('history.filterTitle')}
          >
            <SlidersHorizontal size={18} color={filter === 'all' ? colors.textSecondary : colors.primary} />
          </Pressable>
        </View>

        <Card padded={false} style={{ padding: spacing.md }}>
          <View style={styles.summary}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{t('type.income')}</Text>
              <Text style={[styles.summaryValue, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(periodTotals.income)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{t('type.expense')}</Text>
              <Text style={[styles.summaryValue, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(periodTotals.expense)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{t('dashboard.cashflow')}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: periodTotals.net >= 0 ? colors.income : colors.expense },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {`${periodTotals.net >= 0 ? '+' : '-'}${formatIDR(Math.abs(periodTotals.net))}`}
              </Text>
            </View>
          </View>
          {periodAdjustments.count > 0 ? (
            <Text style={styles.adjustNote}>
              {`${t('report.adjustments')}: ${t('report.adjustmentsSummary', {
                in: formatIDR(periodAdjustments.in),
                out: formatIDR(periodAdjustments.out),
              })} · ${t('common.notCounted')}`}
            </Text>
          ) : null}
        </Card>
      </View>

      {!hydrated ? (
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <SkeletonCard lines={2} height={72} />
          <SkeletonCard lines={2} height={72} />
          <SkeletonCard lines={2} height={72} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={Inbox}
          title={t('history.empty')}
          subtitle={t('history.emptySub')}
          action={{ label: t('input.headingAdd'), onPress: addForRange }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          getItemLayout={getItemLayout}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={9}
          removeClippedSubviews
        />
      )}

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={addForRange} />

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

      <Sheet visible={filtersOpen} title={t('history.filterTitle')} onClose={() => setFiltersOpen(false)}>
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.sheetLabel}>{t('history.rangeLabel')}</Text>
            <SegmentedControl
              options={granularityOptions}
              value={range.granularity}
              onChange={(g) => setRange(rangeFor(g))}
            />
          </View>
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.sheetLabel}>{t('history.typeLabel')}</Text>
            <FilterChips options={filterOptions} value={filter} onChange={setFilter} />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
