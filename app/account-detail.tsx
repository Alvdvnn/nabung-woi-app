import { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Inbox, CircleDollarSign, CircleAlert } from 'lucide-react-native';
import EmptyState from '../components/EmptyState';
import TopBar from '../components/TopBar';
import { useTheme } from '../hooks/useTheme';
import { useCategories } from '../context/CategoriesContext';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { tBuiltin } from '../i18n/labels';
import { radius, spacing, fontSize } from '../constants/theme';
import { Transaction } from '../utils/storage';
import { accountBalance, filterByPeriod, Period } from '../utils/aggregate';
import { findAccountType } from '../constants/accountTypes';
import { formatIDR, formatDate } from '../utils/format';

export default function AccountDetailScreen() {
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();

  const PERIOD_LABELS: Record<Period, string> = {
    day: t('period.today'),
    month: t('period.thisMonth'),
    year: t('period.thisYear'),
  };

  const params = useLocalSearchParams<{ accountId?: string; period?: Period }>();
  const accountId = params.accountId ?? '';
  const period: Period = (params.period as Period) ?? 'month';

  const { txs, accounts, hydrated } = useData();
  const accountsLoaded = hydrated;

  const account = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId]
  );
  const accountType = findAccountType(account?.typeId ?? '');
  const TypeIcon = accountType.icon;

  const accountTxs = useMemo(
    () =>
      txs
        .filter((tx) => tx.accountId === accountId)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [txs, accountId]
  );

  const periodTxs = useMemo(
    () => filterByPeriod(accountTxs, period),
    [accountTxs, period]
  );

  const currentBalance = useMemo(
    () => (account ? accountBalance(account, accountTxs) : 0),
    [account, accountTxs]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        scroll: { paddingBottom: spacing.xxl + 40 },

        hero: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl + 14,
        },
        heroIconRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: spacing.md,
        },
        heroIconWrap: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroTitle: {
          fontSize: fontSize.xl,
          fontWeight: '800',
          color: colors.white,
          letterSpacing: -0.2,
        },
        heroType: {
          fontSize: fontSize.xs,
          color: colors.primarySoft,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        heroLabel: {
          fontSize: fontSize.xs,
          color: colors.primarySoft,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
        heroAmount: {
          fontSize: 36,
          fontWeight: '900',
          color: colors.white,
          letterSpacing: -0.5,
          marginTop: 4,
          lineHeight: 42,
        },
        heroCount: {
          fontSize: fontSize.xs,
          color: colors.primarySoft,
          fontWeight: '600',
          marginTop: 4,
        },

        sheet: {
          backgroundColor: colors.bg,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          marginTop: -28,
          paddingTop: spacing.sm,
        },

        listLabel: {
          fontSize: fontSize.xs,
          fontWeight: '800',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        },

        entryRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
        },
        entryInfo: { flex: 1, gap: 2 },
        entryNote: {
          fontSize: fontSize.md,
          fontWeight: '700',
          color: colors.textPrimary,
          letterSpacing: -0.1,
        },
        entryNoteEmpty: {
          fontSize: fontSize.md,
          fontWeight: '600',
          color: colors.textMuted,
          fontStyle: 'italic',
        },
        entryMeta: {
          fontSize: fontSize.xs,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        entryDate: {
          fontSize: fontSize.xs,
          color: colors.textMuted,
        },
        entryAmount: {
          fontSize: fontSize.md,
          fontWeight: '800',
          letterSpacing: -0.2,
        },
      }),
    [colors]
  );

  const hasEntries = periodTxs.length > 0;
  const accountMissing = accountsLoaded && !account;

  const keyExtractor = useCallback((tx: Transaction) => tx.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      const cat = find(item.categoryId);
      const Icon = cat?.icon ?? CircleDollarSign;
      const isIncome = item.type === 'income';
      return (
        <View style={styles.entryRow}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
              backgroundColor: isIncome ? colors.incomeLight : colors.expenseLight,
            }}
          >
            <Icon size={20} color={isIncome ? colors.income : colors.expense} />
          </View>
          <View style={styles.entryInfo}>
            {item.note ? (
              <Text style={styles.entryNote} numberOfLines={3}>{item.note}</Text>
            ) : (
              <Text style={styles.entryNoteEmpty}>{cat?.name ?? t('common.other')}</Text>
            )}
            <Text style={styles.entryMeta}>{cat?.name ?? t('common.other')}</Text>
            <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
          </View>
          <Text
            style={[styles.entryAmount, { color: isIncome ? colors.income : colors.expense }]}
          >
            {isIncome ? '+' : '-'}{formatIDR(item.amount)}
          </Text>
        </View>
      );
    },
    [find, styles, colors, t]
  );

  if (accountMissing) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <TopBar
          title={t('accountDetail.fallbackTitle')}
          showLogo={false}
          showBack
          showActions={false}
        />
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
          <EmptyState
            Icon={CircleAlert}
            title={t('accountDetail.notFound')}
            subtitle={t('accountDetail.notFoundSub')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <TopBar
        title={t('accountDetail.fallbackTitle')}
        showLogo={false}
        showBack
        showActions={false}
      />
      <FlatList
        data={periodTxs}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroIconRow}>
                <View style={styles.heroIconWrap}>
                  <TypeIcon size={22} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {account?.name ?? t('common.unknownAccount')}
                  </Text>
                  <Text style={styles.heroType}>
                    {tBuiltin(t, 'accountTypes', accountType.id)} · {PERIOD_LABELS[period]}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroLabel}>
                {t('accountDetail.currentBalance')}
              </Text>
              <Text
                style={styles.heroAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatIDR(currentBalance)}
              </Text>
              <Text style={styles.heroCount}>
                {periodTxs.length}{' '}
                {periodTxs.length === 1
                  ? t('accountDetail.entry')
                  : t('accountDetail.entries')}
              </Text>
            </View>

            <View style={styles.sheet}>
              {hasEntries && (
                <Text style={styles.listLabel}>
                  {t('accountDetail.entriesLabel')}
                </Text>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={{ backgroundColor: colors.bg, paddingTop: spacing.lg }}>
            <EmptyState
              Icon={Inbox}
              title={t('accountDetail.noEntries')}
              subtitle={t('accountDetail.noEntriesSub', {
                name: account?.name ?? t('accountDetail.thisAccount'),
              })}
            />
          </View>
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}
