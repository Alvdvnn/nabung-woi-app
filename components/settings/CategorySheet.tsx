import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import SegmentedControl, { Segment } from '../ui/SegmentedControl';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { CUSTOM_ICON_CHOICES, iconForCustom } from '../../constants/categories';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useCategories } from '../../context/CategoriesContext';
import { CategoryKind, CustomCategory, saveCustomCategories } from '../../utils/storage';
import { genId } from '../../utils/id';
import { useT } from '../../i18n';

interface Props {
  visible: boolean;
  /** null creates a new custom category. */
  category: CustomCategory | null;
  /** Kind preselected when creating. */
  kind: CategoryKind;
  onClose: () => void;
  onDelete?: (category: CustomCategory) => void;
  /** Dialogs shown on top of this sheet (delete confirm). */
  overlay?: ReactNode;
}

export default function CategorySheet({ visible, category, kind, onClose, onDelete, overlay }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { customCats, refresh } = useCategories();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryKind>(kind);
  const [iconId, setIconId] = useState(CUSTOM_ICON_CHOICES[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(category?.name ?? '');
    setType(category?.type ?? kind);
    setIconId(category?.iconId ?? CUSTOM_ICON_CHOICES[0]);
    setSaving(false);
  }, [visible, category, kind]);

  const kindOptions = useMemo<Segment<CategoryKind>[]>(
    () => [
      { id: 'expense', label: t('type.expense'), activeColor: colors.expense },
      { id: 'income', label: t('type.income'), activeColor: colors.income },
    ],
    [t, colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { fontSize: fontSize.xs, fontWeight: weight.heavy, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
        input: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: 52,
          fontSize: fontSize.input,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        iconCell: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconCellActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
        deleteBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: 44,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.expenseLight,
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.md,
        },
        deleteText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.expense },
      }),
    [colors],
  );

  async function save() {
    if (!name.trim()) {
      toast.show('error', t('category.errName'));
      return;
    }
    setSaving(true);
    try {
      const next = category
        ? customCats.map((c) => (c.id === category.id ? { ...c, name: name.trim(), type, iconId } : c))
        : [...customCats, { id: genId('c'), name: name.trim(), type, iconId }];
      await saveCustomCategories(next);
      await refresh();
      toast.show('success', category ? t('category.updated') : t('category.added'));
      onClose();
    } catch {
      toast.show('error', t('input.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title={category ? t('category.edit') : t('category.add')}
      onClose={onClose}
      scroll
      overlay={overlay}
      footer={<Button label={t('common.save')} onPress={save} loading={saving} size="lg" />}
    >
      <View style={{ gap: spacing.lg }}>
        <View>
          <Text style={styles.label}>{t('category.name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('category.addPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            accessibilityLabel={t('category.name')}
            autoFocus={!category}
          />
        </View>

        <View>
          <Text style={styles.label}>{t('history.typeLabel')}</Text>
          <SegmentedControl options={kindOptions} value={type} onChange={setType} />
        </View>

        <View>
          <Text style={styles.label}>{t('category.iconLabel')}</Text>
          <View style={styles.iconGrid}>
            {CUSTOM_ICON_CHOICES.map((id) => {
              const ChoiceIcon = iconForCustom(id);
              const active = iconId === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setIconId(id)}
                  style={[styles.iconCell, active && styles.iconCellActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={id}
                >
                  <ChoiceIcon size={20} color={active ? colors.primary : colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {category && onDelete ? (
          <Pressable style={styles.deleteBtn} onPress={() => onDelete(category)} accessibilityRole="button">
            <Trash2 size={16} color={colors.expense} />
            <Text style={styles.deleteText}>{t('common.delete')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Sheet>
  );
}
