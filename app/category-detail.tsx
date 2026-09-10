import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CircleDollarSign, Inbox } from 'lucide-react-native';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import EmptyState from '../components/feedback/EmptyState';
import TransactionItem, { TRANSACTION_ITEM_HEIGHT } from '../components/transaction/TransactionItem';
import { useTheme } from '../hooks/useTheme';
import { useCategories } from '../context/CategoriesContext';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { fontSize, radius, spacing, weight } from '../constants/theme';
import { Transaction } from '../utils/storage';
import { filterByPeriod, Period, totalsOf } from '../utils/aggregate';
import { formatIDR } from '../utils/format';

export default function CategoryDetailScreen() {
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();

  const params = useLocalSearchParams<{ categoryId?: string; period?: Period }>();
  const categoryId = params.categoryId ?? '';
  const period: Period = (params.period as Period) ?? 'month';

  const { txs, accountsById } = useData();

  const cat = find(categoryId);
  const Icon = cat?.icon ?? CircleDollarSign;
  const isIncome = cat?.type === 'income';

  const periodLabel =
    period === 'day' ? t('period.today') : period === 'year' ? t('period.thisYear') : t('period.thisMonth');

  const entries = useMemo(
    () => filterByPeriod(txs, period).filter((tx) => tx.categoryId === categoryId),
    [txs, categoryId, period],
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
        heroName: { fontSize: fontSize.xl, fontWeight: weight.heavy, color: colors.white },
        heroMeta: { fontSize: fontSize.xs, color: colors.primarySoft, marginTop: 2 },
        totalLabel: {
          fontSize: fontSize.xs,
          color: colors.primarySoft,
          fontWeight: weight.bold,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        totalValue: {
          fontSize: fontSize.display,
          fontWeight: weight.black,
          color: colors.white,
          letterSpacing: -0.8,
        },
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

  return (
    <Screen>
      <TopBar title={t('categoryDetail.fallbackTitle')} showLogo={false} showBack showActions={false} />

      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Icon size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName} numberOfLines={1}>
              {cat?.name ?? t('common.unknown')}
            </Text>
            <Text style={styles.heroMeta}>
              {isIncome ? t('type.income') : t('type.expense')}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.totalLabel}>
            {`${isIncome ? t('categoryDetail.totalReceived') : t('categoryDetail.totalSpent')} · ${periodLabel}`}
          </Text>
          <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatIDR(categoryTotal)}
          </Text>
        </View>
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
