import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import SegmentedControl, { Segment } from '../ui/SegmentedControl';
import DateSheet from '../transaction/DateSheet';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { DateRange, PresetGranularity, customRange, rangeFor } from '../../utils/period';
import { formatDateLong, groupDigits } from '../../utils/format';
import { useT } from '../../i18n';
import { EMPTY_FILTERS, HistoryFilters, HistoryTypeFilter } from './filters';

interface Props {
  visible: boolean;
  filters: HistoryFilters;
  range: DateRange;
  /** Live result count for a draft, so the Apply button can say "Show 12". */
  countFor: (filters: HistoryFilters, range: DateRange) => number;
  onApply: (filters: HistoryFilters, range: DateRange) => void;
  onClose: () => void;
}

/** All history filters in one sheet, applied together. */
export default function FilterSheet({ visible, filters, range, countFor, onApply, onClose }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const { accounts } = useData();
  const { byType } = useCategories();

  const [draft, setDraft] = useState<HistoryFilters>(filters);
  const [draftRange, setDraftRange] = useState<DateRange>(range);
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDraft(filters);
    setDraftRange(range);
    setMin(filters.minAmount !== undefined ? String(filters.minAmount) : '');
    setMax(filters.maxAmount !== undefined ? String(filters.maxAmount) : '');
  }, [visible, filters, range]);

  const typeOptions = useMemo<Segment<HistoryTypeFilter>[]>(
    () => [
      { id: 'all', label: t('common.all') },
      { id: 'expense', label: t('type.expense'), activeColor: colors.expense },
      { id: 'income', label: t('type.income'), activeColor: colors.income },
      { id: 'transfer', label: t('type.transfer'), activeColor: colors.transfer },
      { id: 'adjustment', label: t('type.adjustment'), activeColor: colors.adjustment },
    ],
    [t, colors],
  );
  const granularityOptions = useMemo<Segment<PresetGranularity>[]>(
    () => [
      { id: 'day', label: t('period.day') },
      { id: 'week', label: t('period.week') },
      { id: 'month', label: t('period.month') },
      { id: 'year', label: t('period.year') },
    ],
    [t],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { gap: spacing.sm },
        label: { fontSize: fontSize.xs, fontWeight: weight.heavy, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
        chips: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
        wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        rangeRow: { flexDirection: 'row', gap: spacing.sm },
        rangeBtn: {
          flex: 1,
          minHeight: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          justifyContent: 'center',
        },
        rangeLabel: { fontSize: fontSize.xs, color: colors.textMuted },
        rangeValue: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textPrimary },
        amountRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
        amountInput: {
          flex: 1,
          minHeight: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          fontSize: fontSize.input,
          color: colors.textPrimary,
        },
        dash: { color: colors.textMuted },
      }),
    [colors],
  );

  const categories = useMemo(() => {
    if (draft.type === 'expense' || draft.type === 'income') return byType(draft.type);
    if (draft.type === 'all') return [...byType('expense'), ...byType('income')];
    return [];
  }, [byType, draft.type]);

  const effective: HistoryFilters = {
    ...draft,
    minAmount: min ? Number(min) : undefined,
    maxAmount: max ? Number(max) : undefined,
  };
  const count = countFor(effective, draftRange);

  const setType = (type: HistoryTypeFilter) =>
    setDraft((d) => ({ ...d, type, categoryId: type === 'transfer' || type === 'adjustment' ? undefined : d.categoryId }));

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setDraftRange(rangeFor('month'));
    setMin('');
    setMax('');
  };

  return (
    <>
      <Sheet
        visible={visible}
        title={t('history.filterTitle')}
        subtitle={t('history.filterCount', { n: count })}
        onClose={onClose}
        scroll
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label={t('common.reset')} variant="secondary" onPress={reset} fullWidth />
            <Button label={t('history.showResults', { n: count })} onPress={() => onApply(effective, draftRange)} fullWidth />
          </View>
        }
        overlay={
          <>
            <DateSheet
              visible={picking === 'start'}
              value={draftRange.start}
              onChange={(d) => setDraftRange((r) => customRange(d, d > r.end ? d : r.end))}
              onClose={() => setPicking(null)}
              withTime={false}
              title={t('range.from')}
            />
            <DateSheet
              visible={picking === 'end'}
              value={draftRange.end}
              onChange={(d) => setDraftRange((r) => customRange(d < r.start ? d : r.start, d))}
              onClose={() => setPicking(null)}
              withTime={false}
              title={t('range.to')}
            />
          </>
        }
      >
        <View style={{ gap: spacing.lg }}>
          <View style={styles.section}>
            <Text style={styles.label}>{t('history.typeLabel')}</Text>
            {/* Five labels do not fit a segmented row at 375pt; chips wrap instead. */}
            <View style={styles.wrapChips}>
              {typeOptions.map((o) => (
                <Chip key={o.id} label={o.label} size="sm" selected={draft.type === o.id} color={o.activeColor} onPress={() => setType(o.id)} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('history.rangeLabel')}</Text>
            <SegmentedControl
              options={granularityOptions}
              value={draftRange.granularity as PresetGranularity}
              onChange={(g) => setDraftRange(rangeFor(g))}
            />
            <View style={styles.rangeRow}>
              <Chip
                label={draftRange.granularity === 'custom' ? t('range.custom') : t('range.customTitle')}
                Icon={CalendarRange}
                size="sm"
                selected={draftRange.granularity === 'custom'}
                onPress={() => setDraftRange(customRange(draftRange.start, draftRange.end))}
              />
            </View>
            {draftRange.granularity === 'custom' ? (
              <View style={styles.rangeRow}>
                <Chip label={`${t('range.from')}: ${formatDateLong(draftRange.start.toISOString())}`} size="sm" onPress={() => setPicking('start')} />
                <Chip label={`${t('range.to')}: ${formatDateLong(draftRange.end.toISOString())}`} size="sm" onPress={() => setPicking('end')} />
              </View>
            ) : null}
          </View>

          {accounts.length > 1 ? (
            <View style={styles.section}>
              <Text style={styles.label}>{t('input.account')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label={t('common.all')} size="sm" selected={!draft.accountId} onPress={() => setDraft((d) => ({ ...d, accountId: undefined }))} />
                {accounts.map((a) => (
                  <Chip key={a.id} label={a.name} size="sm" selected={draft.accountId === a.id} onPress={() => setDraft((d) => ({ ...d, accountId: a.id }))} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {categories.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.label}>{t('input.category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label={t('common.all')} size="sm" selected={!draft.categoryId} onPress={() => setDraft((d) => ({ ...d, categoryId: undefined }))} />
                {categories.map((c) => (
                  <Chip key={c.id} label={c.name} Icon={c.icon} size="sm" selected={draft.categoryId === c.id} onPress={() => setDraft((d) => ({ ...d, categoryId: c.id }))} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>{t('history.amountLabel')}</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                placeholder={t('history.min')}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                inputMode="numeric"
                value={groupDigits(min)}
                onChangeText={(v) => setMin(v.replace(/[^0-9]/g, ''))}
                accessibilityLabel={t('history.min')}
              />
              <Text style={styles.dash}>-</Text>
              <TextInput
                style={styles.amountInput}
                placeholder={t('history.max')}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                inputMode="numeric"
                value={groupDigits(max)}
                onChangeText={(v) => setMax(v.replace(/[^0-9]/g, ''))}
                accessibilityLabel={t('history.max')}
              />
            </View>
          </View>
        </View>
      </Sheet>

    </>
  );
}
