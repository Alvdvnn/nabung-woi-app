import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { Inbox, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, SlidersHorizontal, X } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import TransactionItem from '../../components/TransactionItem';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import PeriodSelector from '../../components/PeriodSelector';
import { useToast } from '../../hooks/useToast';
import { radius, spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { Transaction, TransactionType, getHistoryPrefs, setHistoryPrefs } from '../../utils/storage';
import { isoDay } from '../../utils/format';
import { tPeriod } from '../../i18n/labels';
import { useT, useLocale } from '../../i18n';
import { DICTS } from '../../i18n/dicts';
import { filterByPeriod, Period, totalsOf } from '../../utils/aggregate';
import { formatDate, formatIDR } from '../../utils/format';

type Filter = 'all' | TransactionType;

const FILTER_IDS: Filter[] = ['all', 'income', 'expense'];

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { locale } = useLocale();

  const { txs, accounts, deleteTx } = useData();
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>('month');
  const [cursor, setCursor] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const prefsLoaded = useRef(false);

  // Load persisted filter + period on mount.
  useEffect(() => {
    getHistoryPrefs().then((p) => {
      if (p) {
        setFilter(p.filter);
        setPeriod(p.period);
      }
      prefsLoaded.current = true;
    });
  }, []);

  // Persist after each change (skip the initial render before load completes).
  useEffect(() => {
    if (!prefsLoaded.current) return;
    setHistoryPrefs({ filter, period });
  }, [filter, period]);

  // If the user opened the app yesterday and is still on the day view,
  // bump cursor to today on focus so the list reflects the new day.
  useFocusEffect(
    useCallback(() => {
      if (period !== 'day') return;
      const today = new Date();
      if (isoDay(cursor) !== isoDay(today)) setCursor(today);
    }, [period, cursor])
  );

  const FILTERS = useMemo(
    () => FILTER_IDS.map((id) => ({
      id,
      label: id === 'all' ? t('type.all') : id === 'income' ? t('type.income') : t('type.expense'),
    })),
    [t]
  );

  const shiftCursor = (dir: 1 | -1) =>
    setCursor((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      const d = prev.getDate();
      if (period === 'day') return new Date(y, m, d + dir);
      if (period === 'year') return new Date(y + dir, 0, 1);
      return new Date(y, m + dir, 1);
    });

  const changePeriod = (p: Period) => {
    setPeriod(p);
    setCursor(new Date());
  };

  function onPickDate(_: DateTimePickerEvent, picked?: Date) {
    setShowDatePicker(false);
    if (picked) setCursor(picked);
  }

  const periodLabel = useMemo(() => {
    if (period === 'day') return formatDate(cursor.toISOString());
    if (period === 'year') return String(cursor.getFullYear());
    return `${DICTS[locale].calendar.months[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }, [period, cursor, locale]);

  const txsInPeriod = useMemo(
    () => filterByPeriod(txs, period, cursor),
    [txs, period, cursor]
  );

  const periodTotals = useMemo(() => totalsOf(txsInPeriod), [txsInPeriod]);

  const filtered = useMemo(() => {
    if (filter === 'all') return txsInPeriod;
    return txsInPeriod.filter((tx) => tx.type === filter);
  }, [txsInPeriod, filter]);

  const accountNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, a.name);
    return m;
  }, [accounts]);

  const keyExtractor = useCallback((tx: Transaction) => tx.id, []);
  const handleDelete = useCallback((id: string) => setPendingDeleteId(id), []);
  const handlePressItem = useCallback(
    (id: string) => router.push({ pathname: '/', params: { id, returnTo: 'history' } }),
    [router]
  );
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem
        item={item}
        accountName={accountNameMap.get(item.accountId)}
        onDelete={handleDelete}
        onPress={handlePressItem}
      />
    ),
    [accountNameMap, handleDelete, handlePressItem]
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await deleteTx(id);
      toast.show('success', t('history.deleted'));
    } catch {
      toast.show('error', t('history.deleteFailed'));
    }
  }, [pendingDeleteId, deleteTx, toast, t]);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.xs,
    },
    navBtn: { padding: spacing.sm },
    navLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.sm },
    navLabelText: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
    filterToggle: {
      padding: spacing.sm,
      marginLeft: spacing.xs,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    netLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    netLineLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    netLineValue: { fontSize: fontSize.md, fontWeight: '800', letterSpacing: -0.2 },

    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
    modalLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    breakdown: { flexDirection: 'row', gap: spacing.md },
    breakdownCell: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 2 },
    breakdownLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
    breakdownValue: { fontSize: fontSize.md, fontWeight: '800' },

    pickerCard: { backgroundColor: colors.card, paddingTop: spacing.md, paddingBottom: spacing.xl, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
    pickerDone: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    pickerDoneText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '700' },

    filters: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    filterBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    filterLabelActive: { color: colors.white },
    list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: contentBottomForFab(insets.bottom) },
  }), [colors, insets.bottom]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <TopBar title={t('history.title')} showLogo={false} />

      <View style={styles.navBar}>
        <Pressable onPress={() => shiftCursor(-1)} style={styles.navBtn} hitSlop={4}>
          <ChevronLeft size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={styles.navLabel} onPress={() => setShowDatePicker(true)}>
          <CalendarIcon size={16} color={colors.primary} />
          <Text style={styles.navLabelText}>{periodLabel}</Text>
        </Pressable>

        <Pressable onPress={() => shiftCursor(1)} style={styles.navBtn} hitSlop={4}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable onPress={() => setFiltersOpen(true)} style={styles.filterToggle} hitSlop={4}>
          <SlidersHorizontal size={18} color={filter === 'all' ? colors.textSecondary : colors.primary} />
        </Pressable>
      </View>

      <View style={styles.netLine}>
        <Text style={styles.netLineLabel}>
          {t('dashboard.netFlow', { period: tPeriod(t, period) })}
        </Text>
        <Text style={[styles.netLineValue, { color: periodTotals.net >= 0 ? colors.income : colors.expense }]}>
          {periodTotals.net >= 0 ? '+' : ''}{formatIDR(periodTotals.net)}
        </Text>
      </View>

      {filtered.length === 0 ? (
        <EmptyState Icon={Inbox} title={t('history.empty')} subtitle={t('history.emptySub')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          extraData={accountNameMap}
        />
      )}
      
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />

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

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker value={cursor} mode="date" onChange={onPickDate} />
      )}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
              <Pressable style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDoneText}>{t('common.done')}</Text>
              </Pressable>
              <DateTimePicker
                value={cursor}
                mode="date"
                display="spinner"
                onChange={(_, picked) => { if (picked) setCursor(picked); }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <Modal
        visible={filtersOpen}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('history.filterTitle')}</Text>
              <Pressable onPress={() => setFiltersOpen(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>{t('history.rangeLabel')}</Text>
            <PeriodSelector value={period} onChange={changePeriod} />

            <Text style={styles.modalLabel}>{t('history.typeLabel')}</Text>
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.id}
                  style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
                  onPress={() => setFilter(f.id)}
                >
                  <Text style={[styles.filterLabel, filter === f.id && styles.filterLabelActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>{t('history.totalsLabel')}</Text>
            <View style={styles.breakdown}>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>{t('type.income')}</Text>
                <Text style={[styles.breakdownValue, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatIDR(periodTotals.income)}
                </Text>
              </View>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownLabel}>{t('type.expense')}</Text>
                <Text style={[styles.breakdownValue, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatIDR(periodTotals.expense)}
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}