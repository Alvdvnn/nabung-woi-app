import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarX, Plus } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import TransactionItem from '../../components/transaction/TransactionItem';
import MoveToDateSheet from '../../components/transaction/MoveToDateSheet';
import EmptyState from '../../components/feedback/EmptyState';
import MonthGrid, { DayDecor } from '../../components/calendar/MonthGrid';
import MonthSummary from '../../components/calendar/MonthSummary';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';
import { useData } from '../../context/DataContext';
import { useDeleteWithUndo } from '../../hooks/useTransactionActions';
import { hapticSelection } from '../../utils/haptics';
import { addMonths, isoDay, startOfMonth } from '../../utils/date';
import { formatDateLong, formatIDR, formatIDRCompact, formatIDRFit } from '../../utils/format';
import { totalsOf } from '../../utils/aggregate';

interface DayStat {
  income: number;
  expense: number;
  count: number;
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accountsById, txByDay } = useData();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(new Date());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [moveId, setMoveId] = useState<string | null>(null);
  const { colors } = useTheme();
  const t = useT();
  const deleteWithUndo = useDeleteWithUndo();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.md, paddingBottom: contentBottomForFab(insets.bottom) },
        dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
        dayTitle: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary, flex: 1 },
        dayNet: { fontSize: fontSize.md, fontWeight: weight.bold },
        summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
        summaryCell: { flex: 1, gap: 2 },
        summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold },
        summaryValue: { fontSize: fontSize.sm, fontWeight: weight.heavy },
        legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.sm },
        legendText: { fontSize: fontSize.xs, color: colors.textMuted },
        swatch: { width: 10, height: 10, borderRadius: 3 },
      }),
    [colors, insets.bottom],
  );

  // Per-day totals for the visible month, computed once per month/data change.
  const monthKey = isoDay(month).slice(0, 7);
  const { dayStats, monthTotals, maxExpense, daysLogged, daysInMonth } = useMemo(() => {
    const stats = new Map<string, DayStat>();
    let max = 0;
    let income = 0;
    let expense = 0;
    for (const [day, list] of txByDay) {
      if (!day.startsWith(monthKey)) continue;
      const tt = totalsOf(list);
      stats.set(day, { income: tt.income, expense: tt.expense, count: list.length });
      income += tt.income;
      expense += tt.expense;
      if (tt.expense > max) max = tt.expense;
    }
    return {
      dayStats: stats,
      monthTotals: { income, expense, net: income - expense },
      maxExpense: max,
      daysLogged: stats.size,
      daysInMonth: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    };
  }, [txByDay, monthKey, month]);

  const decorate = useCallback(
    (iso: string): DayDecor | undefined => {
      const s = dayStats.get(iso);
      if (!s) return undefined;
      const net = s.income - s.expense;
      const heat: DayDecor['heat'] =
        s.expense <= 0 || maxExpense <= 0
          ? 0
          : s.expense / maxExpense > 0.75
            ? 4
            : s.expense / maxExpense > 0.5
              ? 3
              : s.expense / maxExpense > 0.25
                ? 2
                : 1;
      const label =
        net === 0 ? undefined : `${net > 0 ? '+' : '-'}${formatIDRCompact(Math.abs(net)).replace('Rp ', '')}`;
      return {
        dot: true,
        heat,
        income: s.expense === 0 && s.income > 0,
        label,
        labelColor: net >= 0 ? colors.income : colors.expense,
      };
    },
    [dayStats, maxExpense, colors],
  );

  const selectedKey = useMemo(() => isoDay(selected), [selected]);
  const dayTxs = useMemo(() => txByDay.get(selectedKey) ?? [], [txByDay, selectedKey]);
  const dayTotals = useMemo(() => totalsOf(dayTxs), [dayTxs]);

  const changeMonth = useCallback((d: Date) => {
    hapticSelection();
    setMonth(startOfMonth(d));
  }, []);

  // Horizontal swipe on the grid card only. Vertical movement fails the
  // gesture quickly so the page still scrolls, and the 24pt activation
  // distance keeps it clear of taps and of Safari's edge back-swipe.
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-12, 12])
        .onEnd((e) => {
          if (e.translationX < -40) runOnJS(changeMonth)(addMonths(month, 1));
          else if (e.translationX > 40) runOnJS(changeMonth)(addMonths(month, -1));
        }),
    [changeMonth, month],
  );

  const handleDelete = useCallback((id: string) => setPendingDeleteId(id), []);
  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteWithUndo(id);
  }, [pendingDeleteId, deleteWithUndo]);

  // The add button carries the day you are looking at, so a back-dated entry
  // needs no date picking at all.
  const addForSelectedDay = useCallback(() => {
    router.push({ pathname: '/', params: { date: selectedKey, returnTo: 'calendar' } });
  }, [router, selectedKey]);

  const goToday = () => {
    const now = new Date();
    setSelected(now);
    setMonth(startOfMonth(now));
  };

  return (
    <Screen>
      <TopBar title={t('calendar.title')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthSummary totals={monthTotals} daysLogged={daysLogged} daysInMonth={daysInMonth} />

        <GestureDetector gesture={swipe}>
          <View>
            <Card padded={false} style={{ padding: spacing.md }}>
              <MonthGrid
                month={month}
                selected={selected}
                onSelectDate={(d) => {
                  setSelected(d);
                  if (d.getMonth() !== month.getMonth()) setMonth(startOfMonth(d));
                }}
                onChangeMonth={changeMonth}
                decorate={decorate}
              />
              <View style={styles.legend}>
                <View style={[styles.swatch, { backgroundColor: `${colors.expense}33` }]} />
                <View style={[styles.swatch, { backgroundColor: `${colors.expense}99` }]} />
                <View style={[styles.swatch, { backgroundColor: colors.expense }]} />
                <Text style={styles.legendText}>{t('calendar.heatLegend')}</Text>
              </View>
            </Card>
          </View>
        </GestureDetector>

        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle} numberOfLines={1}>
            {formatDateLong(selected.toISOString())}
          </Text>
          {selectedKey !== isoDay(new Date()) ? (
            <Chip label={t('period.today')} size="sm" onPress={goToday} />
          ) : (
            <Text style={[styles.dayNet, { color: dayTotals.net >= 0 ? colors.income : colors.expense }]}>
              {`${dayTotals.net >= 0 ? '+' : '-'}${formatIDR(Math.abs(dayTotals.net))}`}
            </Text>
          )}
        </View>

        {dayTxs.length > 0 ? (
          <Card padded={false} style={{ padding: spacing.md }}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('type.income')}</Text>
                <Text style={[styles.summaryValue, { color: colors.income }]} numberOfLines={1}>
                  {formatIDRFit(dayTotals.income)}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('type.expense')}</Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]} numberOfLines={1}>
                  {formatIDRFit(dayTotals.expense)}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('report.txCount')}</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{dayTxs.length}</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {dayTxs.length === 0 ? (
          <EmptyState
            Icon={CalendarX}
            title={t('calendar.empty')}
            subtitle={t('calendar.emptySub')}
            action={{ label: t('input.headingAdd'), onPress: addForSelectedDay }}
          />
        ) : (
          dayTxs.map((tx) => (
            <TransactionItem
              key={tx.id}
              item={tx}
              accountName={accountsById.get(tx.accountId)?.name}
              onPress={(id) => router.push({ pathname: '/', params: { id, returnTo: 'calendar' } })}
              onMove={setMoveId}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={addForSelectedDay} accessibilityLabel={t('input.headingAdd')} />

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
    </Screen>
  );
}
