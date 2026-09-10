import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarX, Plus } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import Card from '../../components/ui/Card';
import TransactionItem from '../../components/transaction/TransactionItem';
import EmptyState from '../../components/feedback/EmptyState';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';
import { useData } from '../../context/DataContext';
import { useDeleteWithUndo } from '../../hooks/useTransactionActions';
import { isoDay } from '../../utils/date';
import { formatDate, formatIDR } from '../../utils/format';
import { totalsOf } from '../../utils/aggregate';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accountsById, txByDay, txDates } = useData();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { colors } = useTheme();
  const t = useT();
  const deleteWithUndo = useDeleteWithUndo();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: contentBottomForFab(insets.bottom),
        },
        dayHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.sm,
        },
        dayTitle: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        dayNet: { fontSize: fontSize.md, fontWeight: weight.bold },
        summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
        summaryCell: { flex: 1, gap: 2 },
        summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold },
        summaryValue: { fontSize: fontSize.md, fontWeight: weight.heavy },
      }),
    [colors, insets.bottom],
  );

  const selectedKey = useMemo(() => isoDay(selected), [selected]);
  // The day index is built once in DataContext, so switching days is a map hit
  // instead of a scan over every transaction.
  const dayTxs = useMemo(() => txByDay.get(selectedKey) ?? [], [txByDay, selectedKey]);
  const dayTotals = useMemo(() => totalsOf(dayTxs), [dayTxs]);

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

  return (
    <Screen>
      <TopBar title={t('calendar.title')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CalendarGrid
          month={month}
          selected={selected}
          txDates={txDates}
          onChangeMonth={setMonth}
          onSelectDate={setSelected}
        />

        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{formatDate(selected.toISOString())}</Text>
          <Text
            style={[styles.dayNet, { color: dayTotals.net >= 0 ? colors.income : colors.expense }]}
          >
            {`${dayTotals.net >= 0 ? '+' : '-'}${formatIDR(Math.abs(dayTotals.net))}`}
          </Text>
        </View>

        {dayTxs.length > 0 ? (
          <Card padded={false} style={{ padding: spacing.md }}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('type.income')}</Text>
                <Text style={[styles.summaryValue, { color: colors.income }]} numberOfLines={1}>
                  {formatIDR(dayTotals.income)}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('type.expense')}</Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]} numberOfLines={1}>
                  {formatIDR(dayTotals.expense)}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{t('report.txCount')}</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {dayTxs.length}
                </Text>
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
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={addForSelectedDay} />

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
