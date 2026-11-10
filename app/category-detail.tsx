import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleDollarSign, Inbox } from 'lucide-react-native';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import EmptyState from '../components/feedback/EmptyState';
import RangeNav, { useRangeLabel } from '../components/report/RangeNav';
import TransactionItem, { TRANSACTION_ITEM_HEIGHT } from '../components/transaction/TransactionItem';
import { useTheme } from '../hooks/useTheme';
import { useCategories } from '../context/CategoriesContext';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { fontSize, radius, spacing, weight } from '../constants/theme';
import { Transaction } from '../utils/storage';
import { filterByRange, totalsOf } from '../utils/aggregate';
import { DateRange, rangeFor, rangeFromParams, shiftRange, isGranularity } from '../utils/period';
import { formatIDR } from '../utils/format';

/**
 * Category drilldown. The range arrives from the caller (Report, Dashboard)
 * so the list and total here equal the row that was tapped; prev/next then
 * step the same granularity from inside this screen.
 */
export default function CategoryDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();

  const params = useLocalSearchParams<{
    categoryId?: string;
    granularity?: string;
    start?: string;
    end?: string;
    /** v1 param, kept so old links still open on the current period. */
    period?: string;
  }>();
  const categoryId = params.categoryId ?? '';

  const [range, setRange] = useState<DateRange>(() => {
    const fromParams = rangeFromParams(params);
    if (fromParams) return fromParams;
    const legacy = params.period;
    return rangeFor(isGranularity(legacy) ? legacy : 'month');
  });
  const rangeLabel = useRangeLabel(range);

  const { txs, accountsById } = useData();

  const cat = find(categoryId);
  const Icon = cat?.icon ?? CircleDollarSign;
  const isIncome = cat?.type === 'income';

  const entries = useMemo(
    () => filterByRange(txs, range).filter((tx) => tx.categoryId === categoryId),
    [txs, categoryId, range],
  );

  const totals = useMemo(() => totalsOf(entries), [entries]);
  const categoryTotal = isIncome ? totals.income : totals.expense;

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
        heroName: { fontSize: fontSize.xl, fontWeight: weight.heavy, color: colors.onPrimary },
        heroMeta: { fontSize: fontSize.xs, color: colors.onPrimary, opacity: 0.8, marginTop: 2 },
        totalLabel: {
          fontSize: fontSize.xs,
          color: colors.onPrimary,
          opacity: 0.8,
          fontWeight: weight.bold,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        totalValue: {
          fontSize: fontSize.display,
          lineHeight: 40,
          fontWeight: weight.black,
          color: colors.onPrimary,
          letterSpacing: -0.8,
        },
        nav: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
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
        list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
      }),
    [colors],
  );

  const keyExtractor = useCallback((tx: Transaction) => tx.id, []);
  const openTx = useCallback(
    (id: string) => router.push({ pathname: '/', params: { id, returnTo: 'report' } }),
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem item={item} accountName={accountsById.get(item.accountId)?.name} onPress={openTx} />
    ),
    [accountsById, openTx],
  );
  const getItemLayout = useCallback(
    (_: ArrayLike<Transaction> | null | undefined, index: number) => ({
      length: TRANSACTION_ITEM_HEIGHT,
      offset: TRANSACTION_ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <Screen>
      <TopBar title={t('categoryDetail.fallbackTitle')} showLogo={false} showBack showActions={false} />

      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Icon size={22} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName} numberOfLines={1}>
              {cat?.name ?? t('common.unknown')}
            </Text>
            <Text style={styles.heroMeta}>{isIncome ? t('type.income') : t('type.expense')}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.totalLabel}>
            {`${isIncome ? t('categoryDetail.totalReceived') : t('categoryDetail.totalSpent')} · ${rangeLabel}`}
          </Text>
          <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatIDR(categoryTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.nav}>
        <RangeNav range={range} onShift={(dir) => setRange((r) => shiftRange(r, dir))} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('categoryDetail.entriesLabel')}</Text>
        <Text style={styles.sectionMeta}>
          {`${entries.length} ${entries.length === 1 ? t('categoryDetail.entry') : t('categoryDetail.entries')}`}
        </Text>
      </View>

      {entries.length === 0 ? (
        <EmptyState
          Icon={Inbox}
          title={t('categoryDetail.noEntries')}
          subtitle={t('categoryDetail.noEntriesSub', {
            name: cat?.name ?? t('categoryDetail.thisCategory'),
          })}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          windowSize={9}
          removeClippedSubviews
        />
      )}
    </Screen>
  );
}
