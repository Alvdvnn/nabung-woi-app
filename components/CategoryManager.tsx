import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useCategories } from '../context/CategoriesContext';
import { CustomCategory, saveCustomCategories, TransactionType } from '../utils/storage';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CUSTOM_ICON } from '../constants/categories';
import ConfirmModal from './ConfirmModal';
import { genId } from '../utils/id';
import { useT } from '../i18n';
import { tBuiltin } from '../i18n/labels';

interface Props {
  categories: CustomCategory[];
  onChange: (cats: CustomCategory[]) => void;
}

export default function CategoryManager({ categories, onChange }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<CustomCategory | null>(null);
  const { colors } = useTheme();
  const toast = useToast();
  const { refresh } = useCategories();
  const t = useT();

  const styles = useMemo(() => StyleSheet.create({
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: radius.full,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center' },
    toggleActive: { backgroundColor: colors.primary },
    toggleLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    toggleLabelActive: { color: colors.white },
    subhead: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm, letterSpacing: 0.5 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    defaultChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    defaultText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
    empty: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: radius.sm,
      padding: spacing.md, marginBottom: spacing.xs,
      borderWidth: 1, borderColor: colors.border,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    iconBadge: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    rowName: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '500' },
    addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    input: {
      flex: 1, backgroundColor: colors.card, borderRadius: radius.sm,
      padding: spacing.md, fontSize: fontSize.sm, color: colors.textPrimary,
      borderWidth: 1, borderColor: colors.border,
    },
    addBtn: {
      width: 44, height: 44, borderRadius: radius.sm,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
  }), [colors]);

  const defaults = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const customForType = categories.filter((c) => c.type === type);
  const Icon = CUSTOM_ICON;

  async function add() {
    if (!name.trim()) { toast.show('error', t('category.errName')); return; }
    const next = [...categories, { id: genId('c'), name: name.trim(), type, iconId: 'other' }];
    await saveCustomCategories(next);
    onChange(next);
    await refresh();
    setName('');
    toast.show('success', t('category.added'));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const next = categories.filter((c) => c.id !== pendingDelete.id);
    await saveCustomCategories(next);
    onChange(next);
    await refresh();
    setPendingDelete(null);
    toast.show('success', t('category.removed'));
  }

  return (
    <View>
      <View style={styles.toggle}>
        {(['expense', 'income'] as TransactionType[]).map((kind) => (
          <Pressable
            key={kind}
            style={[styles.toggleBtn, type === kind && styles.toggleActive]}
            onPress={() => setType(kind)}
          >
            <Text style={[styles.toggleLabel, type === kind && styles.toggleLabelActive]}>
              {kind === 'expense' ? t('type.expense') : t('type.income')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.subhead}>{t('category.defaultHead')}</Text>
      <View style={styles.chips}>
        {defaults.map((c) => (
          <View key={c.id} style={styles.defaultChip}>
            <Text style={styles.defaultText}>{tBuiltin(t, 'categories', c.id)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subhead}>{t('category.customHead')}</Text>
      {customForType.length === 0 ? (
        <Text style={styles.empty}>{t('category.noCustom')}</Text>
      ) : (
        customForType.map((c) => (
          <View key={c.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Icon size={14} color={colors.primary} />
              </View>
              <Text style={styles.rowName}>{c.name}</Text>
            </View>
            <Pressable onPress={() => setPendingDelete(c)} hitSlop={8}>
              <Trash2 size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={t('category.addPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <Pressable style={styles.addBtn} onPress={add}>
          <Plus size={16} color={colors.white} />
        </Pressable>
      </View>

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
    </View>
  );
}
