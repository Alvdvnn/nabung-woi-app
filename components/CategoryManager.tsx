import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing, fontSize } from '../constants/theme';
import { CustomCategory, saveCustomCategories, TransactionType } from '../utils/storage';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

interface Props {
  categories: CustomCategory[];
  onChange: (cats: CustomCategory[]) => void;
}

export default function CategoryManager({ categories, onChange }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');

  const defaults = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const customForType = categories.filter((c) => c.type === type);

  async function add() {
    if (!name.trim()) return;
    const next = [...categories, { id: `c${Date.now()}`, name: name.trim(), type, iconId: 'other' }];
    await saveCustomCategories(next);
    onChange(next);
    setName('');
  }

  function remove(id: string) {
    Alert.alert('Delete category?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const next = categories.filter((c) => c.id !== id);
          await saveCustomCategories(next);
          onChange(next);
        },
      },
    ]);
  }

  return (
    <View>
      <View style={styles.toggle}>
        {(['expense', 'income'] as TransactionType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.toggleBtn, type === t && styles.toggleActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.toggleLabel, type === t && styles.toggleLabelActive]}>
              {t === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.subhead}>Default</Text>
      <View style={styles.chips}>
        {defaults.map((c) => (
          <View key={c.id} style={styles.defaultChip}>
            <Text style={styles.defaultText}>{c.name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subhead}>Custom</Text>
      {customForType.length === 0 ? (
        <Text style={styles.empty}>No custom categories yet.</Text>
      ) : (
        customForType.map((c) => (
          <View key={c.id} style={styles.row}>
            <Text style={styles.rowName}>{c.name}</Text>
            <Pressable onPress={() => remove(c.id)} hitSlop={8}>
              <Trash2 size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New category name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <Pressable style={styles.addBtn} onPress={add}>
          <Plus size={16} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
