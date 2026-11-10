import { ScrollView, StyleSheet } from 'react-native';
import Chip from '../ui/Chip';
import { spacing } from '../../constants/theme';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';
import { HistoryFilters } from './filters';

interface Props {
  filters: HistoryFilters;
  onChange: (next: HistoryFilters) => void;
}

/** Removable chips summarising the active filters above the list. */
export default function ActiveFilters({ filters, onChange }: Props) {
  const t = useT();
  const { accountsById } = useData();
  const { find } = useCategories();

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.type !== 'all') {
    chips.push({ key: 'type', label: t(`type.${filters.type}`), remove: () => onChange({ ...filters, type: 'all' }) });
  }
  if (filters.accountId) {
    chips.push({
      key: 'account',
      label: accountsById.get(filters.accountId)?.name ?? t('common.unknownAccount'),
      remove: () => onChange({ ...filters, accountId: undefined }),
    });
  }
  if (filters.categoryId) {
    chips.push({
      key: 'category',
      label: find(filters.categoryId)?.name ?? t('common.other'),
      remove: () => onChange({ ...filters, categoryId: undefined }),
    });
  }
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const lo = filters.minAmount !== undefined ? formatIDRCompact(filters.minAmount) : '';
    const hi = filters.maxAmount !== undefined ? formatIDRCompact(filters.maxAmount) : '';
    chips.push({
      key: 'amount',
      label: lo && hi ? `${lo} - ${hi}` : lo ? `≥ ${lo}` : `≤ ${hi}`,
      remove: () => onChange({ ...filters, minAmount: undefined, maxAmount: undefined }),
    });
  }
  if (chips.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} size="sm" selected onRemove={c.remove} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
});
