import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, Plus, SlidersHorizontal } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import Card from '../../components/ui/Card';
import SearchField from '../../components/ui/SearchField';
import { SkeletonCard } from '../../components/ui/Skeleton';
import TransactionItem from '../../components/transaction/TransactionItem';
import MoveToDateSheet from '../../components/transaction/MoveToDateSheet';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import RangeNav from '../../components/report/RangeNav';
import FilterSheet from '../../components/history/FilterSheet';
import ActiveFilters from '../../components/history/ActiveFilters';
import { EMPTY_FILTERS, HistoryFilters, activeFilterCount, matchesFilters } from '../../components/history/filters';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { useDeleteWithUndo } from '../../hooks/useTransactionActions';
import { Transaction, getHistoryPrefs, setHistoryPrefs } from '../../utils/storage';
import { useT } from '../../i18n';
import { DateRange, rangeFor, rangeFromParams, shiftRange } from '../../utils/period';
import { addDays, isoDay, parseIsoDay } from '../../utils/date';
import { adjustmentTotals, filterByRange, totalsOf } from '../../utils/aggregate';
import { formatDateLong, formatIDR, formatIDRCompact } from '../../utils/format';

interface DaySection {
  title: string;
  dayKey: string;
  net: number;
  data: Transaction[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();

  const { txs, accountsById, hydrated } = useData();
  const { find } = useCategories();
  const deleteWithUndo = useDeleteWithUndo();

  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const [range, setRange] = useState<DateRange>(() => rangeFor('month'));
  const [query, setQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const prefsLoaded = useRef(false);

  // Report (and other screens) can open History scoped to a range.
  const incoming = useLocalSearchParams<{ granularity?: string; start?: string; end?: string }>();
  const incomingKey = `${incoming.granularity ?? ''}|${incoming.start ?? ''}|${incoming.end ?? ''}`;
  useEffect(() => {
    const r = rangeFromParams(incoming);
    if (r) setRange(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey]);

  // Load persisted filters + period on mount.
  useEffect(() => {
    getHistoryPrefs().then((p) => {
      if (p) {
        setFilters({
          type: p.filter,
          accountId: p.accountId,
          categoryId: p.categoryId,
          minAmount: p.minAmount,
          maxAmount: p.maxAmount,
        });
        if (!rangeFromParams(incoming)) setRange(rangeFor(p.period));
      }
      prefsLoaded.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist after each change (skip the initial render before load completes).
  useEffect(() => {
    if (!prefsLoaded.current) return;
    setHistoryPrefs({
      filter: filters.type,
      period: range.granularity === 'custom' ? 'month' : range.granularity,
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
    });
  }, [filters, range.granularity]);

  // If the calendar day rolled over while the app sat in the background, a day
  // view that was showing "today" follows along.
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

  const txsInRange = useMemo(() => filterByRange(txs, range), [txs, range]);
  const periodTotals = useMemo(() => totalsOf(txsInRange), [txsInRange]);
  const periodAdjustments = useMemo(() => adjustmentTotals(txsInRange), [txsInRange]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const base = txsInRange.filter((tx) => matchesFilters(tx, filters));
    if (!q) return base;
    return base.filter((tx) => {
      if (tx.note.toLowerCase().includes(q)) return true;
      const name = find(tx.categoryId)?.name.toLowerCase();
      if (name && name.includes(q)) return true;
      const acc = accountsById.get(tx.accountId)?.name.toLowerCase();
      return !!acc && acc.includes(q);
    });
  }, [txsInRange, filters, q, find, accountsById]);

  const countFor = useCallback(
    (f: HistoryFilters, r: DateRange) => filterByRange(txs, r).filter((tx) => matchesFilters(tx, f)).length,
    [txs],
  );

  // Group by day (list is newest first, so sections come out newest first too).
  const sections = useMemo<DaySection[]>(() => {
    const todayKey = isoDay(new Date());
    const yesterdayKey = isoDay(addDays(new Date(), -1));
    const out: DaySection[] = [];
    let cur: DaySection | null = null;
    for (const tx of filtered) {
      if (!cur || cur.dayKey !== tx.dayKey) {
        const title =
          tx.dayKey === todayKey
            ? t('period.today')
            : tx.dayKey === yesterdayKey
              ? t('date.yesterday')
              : formatDateLong(parseIsoDay(tx.dayKey).toISOString());
        cur = { title, dayKey: tx.dayKey, net: 0, data: [] };
        out.push(cur);
      }
      cur.data.push(tx);
      if (tx.type === 'income') cur.net += tx.amount;
      else if (tx.type === 'expense') cur.net -= tx.amount;
    }
    return out;
  }, [filtered, t]);

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
        onMove={setMoveId}
      />
    ),
    [accountsById, handleDelete, handlePressItem],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteWithUndo(id);
  }, [pendingDeleteId, deleteWithUndo]);

  const addForRange = useCallback(() => {
    const params = range.granularity === 'day' ? { date: range.startKey, returnTo: 'history' } : { returnTo: 'history' };
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
        badge: {
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
        badgeText: { fontSize: 10, fontWeight: weight.heavy, color: colors.onPrimary },
        summary: { flexDirection: 'row', gap: spacing.md },
        summaryCell: { flex: 1, gap: 2 },
        summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold, textTransform: 'uppercase', letterSpacing: 0.4 },
        summaryValue: { fontSize: fontSize.md, fontWeight: weight.heavy },
        adjustNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
        chips: { marginTop: spacing.xs },
        resultCount: { fontSize: fontSize.xs, color: colors.textMuted, paddingTop: spacing.sm },
        list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: contentBottomForFab(insets.bottom) },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.bg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
        sectionTitle: { fontSize: fontSize.sm, fontWeight: weight.heavy, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
        sectionNet: { fontSize: fontSize.sm, fontWeight: weight.bold },
      }),
    [colors, insets.bottom],
  );

  const activeCount = activeFilterCount(filters);

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
            style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={t('history.filterTitle')}
          >
            <SlidersHorizontal size={18} color={activeCount > 0 ? colors.primary : colors.textSecondary} />
            {activeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            ) : null}
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
                style={[styles.summaryValue, { color: periodTotals.net >= 0 ? colors.income : colors.expense }]}
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

        <SearchField value={query} onChange={setQuery} placeholder={t('history.searchPlaceholder')} />
      </View>

      {activeCount > 0 ? (
        <View style={styles.chips}>
          <ActiveFilters filters={filters} onChange={setFilters} />
        </View>
      ) : null}

      {!hydrated ? (
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <SkeletonCard lines={2} height={72} />
          <SkeletonCard lines={2} height={72} />
          <SkeletonCard lines={2} height={72} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={Inbox}
          title={activeCount > 0 || q ? t('history.noMatch') : t('history.empty')}
          subtitle={activeCount > 0 || q ? t('history.noMatchSub') : t('history.emptySub')}
          action={
            activeCount > 0 || q
              ? { label: t('common.reset'), onPress: () => { setFilters(EMPTY_FILTERS); setQuery(''); } }
              : { label: t('input.headingAdd'), onPress: addForRange }
          }
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={[styles.sectionNet, { color: section.net >= 0 ? colors.income : colors.expense }]}>
                {`${section.net >= 0 ? '+' : '-'}${formatIDRCompact(Math.abs(section.net))}`}
              </Text>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.resultCount}>{t('history.filterCount', { n: filtered.length })}</Text>}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={9}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={addForRange} accessibilityLabel={t('input.headingAdd')} />

      <MoveToDateSheet txId={moveId} onClose={() => setMoveId(null)} />

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

      <FilterSheet
        visible={filtersOpen}
        filters={filters}
        range={range}
        countFor={countFor}
        onApply={(f, r) => {
          setFilters(f);
          setRange(r);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </Screen>
  );
}
