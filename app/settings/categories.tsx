import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Tag } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import SearchField from '../../components/ui/SearchField';
import SegmentedControl, { Segment } from '../../components/ui/SegmentedControl';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import CategorySheet from '../../components/settings/CategorySheet';
import { fontSize, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useCategoryUsage } from '../../hooks/useCategoryUsage';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { usePrefs } from '../../context/PrefsContext';
import { CategoryKind, CustomCategory, saveCustomCategories } from '../../utils/storage';
import { formatIDRCompact } from '../../utils/format';
import { useT } from '../../i18n';

const SEARCH_THRESHOLD = 8;

/** Categories: expense/income toggle, search when long, built-in vs custom, usage counts. */
export default function CategoriesSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { txs } = useData();
  const { byType, customCats, refresh } = useCategories();
  const { budgetsByCategory } = usePrefs();
  const usage = useCategoryUsage(txs);

  const [kind, setKind] = useState<CategoryKind>('expense');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CustomCategory | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CustomCategory | null>(null);

  const kindOptions = useMemo<Segment<CategoryKind>[]>(
    () => [
      { id: 'expense', label: t('type.expense'), activeColor: colors.expense },
      { id: 'income', label: t('type.income'), activeColor: colors.income },
    ],
    [t, colors],
  );

  const all = byType(kind);
  const customIds = useMemo(() => new Set(customCats.map((c) => c.id)), [customCats]);
  const q = query.trim().toLowerCase();
  const filtered = q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all;
  const builtIn = filtered.filter((c) => !customIds.has(c.id));
  const custom = filtered.filter((c) => customIds.has(c.id));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        noResults: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
      }),
    [colors, insets.bottom],
  );

  const usageText = (id: string) => {
    const n = usage.total.get(id) ?? 0;
    const budget = budgetsByCategory.get(id);
    const parts = [n === 0 ? t('category.noUsage') : t('category.usage', { n })];
    if (budget) parts.push(t('category.budgetHint', { amount: formatIDRCompact(budget) }));
    return parts.join(' · ');
  };

  async function confirmDelete() {
    if (!pendingDelete) return;
    await saveCustomCategories(customCats.filter((c) => c.id !== pendingDelete.id));
    await refresh();
    setPendingDelete(null);
    setSheetOpen(false);
    toast.show('success', t('category.removed'));
  }

  return (
    <Screen>
      <TopBar title={t('settings.categories')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SegmentedControl options={kindOptions} value={kind} onChange={(k) => { setKind(k); setQuery(''); }} />

        {all.length > SEARCH_THRESHOLD ? (
          <SearchField value={query} onChange={setQuery} placeholder={t('category.searchPlaceholder')} />
        ) : null}

        {filtered.length === 0 ? (
          <Text style={styles.noResults}>{t('category.noResults')}</Text>
        ) : null}

        {builtIn.length > 0 ? (
          <SectionGroup title={t('category.defaultHead')} footer={t('category.builtInFooter')}>
            {builtIn.map((c) => (
              <ListRow key={c.id} Icon={c.icon} title={c.name} subtitle={usageText(c.id)} />
            ))}
          </SectionGroup>
        ) : null}

        {custom.length > 0 ? (
          <SectionGroup title={t('category.customHead')}>
            {custom.map((c) => {
              const raw = customCats.find((cc) => cc.id === c.id)!;
              return (
                <ListRow
                  key={c.id}
                  Icon={c.icon}
                  title={c.name}
                  subtitle={usageText(c.id)}
                  trailing="chevron"
                  onPress={() => {
                    setEditing(raw);
                    setSheetOpen(true);
                  }}
                />
              );
            })}
          </SectionGroup>
        ) : !q ? (
          <EmptyState Icon={Tag} title={t('category.noCustom')} subtitle={t('category.noCustomSub')} />
        ) : null}

        <Button
          label={t('category.add')}
          Icon={Plus}
          variant="secondary"
          onPress={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        />
        <View />
      </ScrollView>

      <CategorySheet
        visible={sheetOpen}
        category={editing}
        kind={kind}
        onClose={() => setSheetOpen(false)}
        onDelete={(c) => setPendingDelete(c)}
        overlay={
          <ConfirmModal
            visible={!!pendingDelete}
            title={t('category.deleteTitle')}
            message={pendingDelete ? t('category.deleteMsg', { name: pendingDelete.name }) : ''}
            confirmLabel={t('common.delete')}
            cancelLabel={t('common.cancel')}
            tone="danger"
            onConfirm={confirmDelete}
            onCancel={() => setPendingDelete(null)}
          />
        }
      />
    </Screen>
  );
}
