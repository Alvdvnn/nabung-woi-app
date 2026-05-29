import { useMemo } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Inbox, CircleDollarSign } from 'lucide-react-native';
import EmptyState from '../components/EmptyState';
import TopBar from '../components/TopBar';
import { useTheme } from '../hooks/useTheme';
import { useCategories } from '../context/CategoriesContext';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { radius, spacing, fontSize } from '../constants/theme';
import { filterByPeriod, Period, totalsOf } from '../utils/aggregate';
import { formatIDR, formatDate } from '../utils/format';

export default function CategoryDetailScreen() {
  const { colors } = useTheme();
  const { find } = useCategories();
  const t = useT();
  const PERIOD_LABELS: Record<Period, string> = {
    day: t('period.today'),
    month: t('period.thisMonth'),
    year: t('period.thisYear'),
  };

  const params = useLocalSearchParams<{ categoryId?: string; period?: Period }>();
  const categoryId = params.categoryId ?? '';
  const period: Period = (params.period as Period) ?? 'month';

  const { txs, accounts } = useData();

  const cat = find(categoryId);
  const Icon = cat?.icon ?? CircleDollarSign;

  const filteredForCategory = useMemo(() => {
    const inPeriod = filterByPeriod(txs, period);
    return inPeriod
      .filter((t) => t.categoryId === categoryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [txs, categoryId, period]);

  const totals = useMemo(() => totalsOf(filteredForCategory), [filteredForCategory]);
  const categoryTotal = cat?.type === 'income' ? totals.income : totals.expense;
  const isIncome = cat?.type === 'income';

  const accountNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, a.name);
    return m;
  }, [accounts]);

  const styles = useMemo(() => StyleSheet.create({
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
      width: 44, height: 44, borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: {
      fontSize: fontSize.xl,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -0.2,
    },
    heroPeriod: {
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
    entryIconWrap: {
      width: 36, height: 36, borderRadius: radius.full,
      alignItems: 'center', justifyContent: 'center',
      marginRight: spacing.md,
      backgroundColor: isIncome ? colors.incomeLight : colors.expenseLight,
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
      color: isIncome ? colors.income : colors.expense,
    },
  }), [colors, isIncome]);

  const hasEntries = filteredForCategory.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar
        title={t('categoryDetail.fallbackTitle')}
        showLogo={false}
        showBack
        showActions={false}
      />
      <FlatList
        data={filteredForCategory}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroIconRow}>
                <View style={styles.heroIconWrap}>
                  <Icon size={22} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {cat?.name ?? t('common.unknown')}
                  </Text>
                  <Text style={styles.heroPeriod}>{PERIOD_LABELS[period]}</Text>
                </View>
              </View>

              <Text style={styles.heroLabel}>
                {isIncome ? t('categoryDetail.totalReceived') : t('categoryDetail.totalSpent')}
              </Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                {formatIDR(categoryTotal)}
              </Text>
              <Text style={styles.heroCount}>
                {filteredForCategory.length} {filteredForCategory.length === 1 ? t('categoryDetail.entry') : t('categoryDetail.entries')}
              </Text>
            </View>

            <View style={styles.sheet}>
              {hasEntries && <Text style={styles.listLabel}>{t('categoryDetail.entriesLabel')}</Text>}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={{ backgroundColor: colors.bg, paddingTop: spacing.lg }}>
            <EmptyState
              Icon={Inbox}
              title={t('categoryDetail.noEntries')}
              subtitle={t('categoryDetail.noEntriesSub', { name: cat?.name ?? t('categoryDetail.thisCategory') })}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <View style={styles.entryIconWrap}>
              <Icon size={20} color={isIncome ? colors.income : colors.expense} />
            </View>
            <View style={styles.entryInfo}>
              {item.note ? (
                <Text style={styles.entryNote} numberOfLines={3}>{item.note}</Text>
              ) : (
                <Text style={styles.entryNoteEmpty}>{t('common.noNote')}</Text>
              )}
              <Text style={styles.entryMeta}>
                {accountNameMap.get(item.accountId) ?? t('common.unknownAccount')}
              </Text>
              <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.entryAmount}>
              {isIncome ? '+' : '-'}{formatIDR(item.amount)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
