import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import IconBadge from '../ui/IconBadge';
import { CategoryDef } from '../../constants/categories';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { hapticSelection } from '../../utils/haptics';
import { useT } from '../../i18n';

interface Props {
  categories: CategoryDef[];
  value: string;
  onChange: (id: string) => void;
  /** Accent for the selected tile (matches the transaction type). */
  accent?: string;
  /** How many tiles show before "More". */
  initial?: number;
}

const COLUMNS = 4;

/**
 * Aligned grid of category tiles. Rows are chunked so every tile keeps the
 * same width whatever the label length; the selected one is never hidden
 * behind "More".
 */
export default function CategoryGrid({ categories, value, onChange, accent, initial = 8 }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const tint = accent ?? colors.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: { gap: spacing.sm },
        row: { flexDirection: 'row', gap: spacing.sm },
        tile: {
          flex: 1,
          minHeight: 78,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 4,
          paddingVertical: spacing.sm,
        },
        tileActive: { borderColor: tint, backgroundColor: colors.surfaceAlt, borderWidth: 2 },
        label: { fontSize: fontSize.xs, fontWeight: weight.semibold, color: colors.textSecondary, textAlign: 'center' },
        labelActive: { color: tint, fontWeight: weight.bold },
        more: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          minHeight: 44,
        },
        moreText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.primary },
      }),
    [colors, tint],
  );

  const visible = useMemo(() => {
    if (expanded || categories.length <= initial) return categories;
    const head = categories.slice(0, initial);
    const selected = categories.find((c) => c.id === value);
    if (selected && !head.some((c) => c.id === value)) {
      // Keep the current choice visible by swapping it into the last slot.
      head[initial - 1] = selected;
    }
    return head;
  }, [categories, expanded, initial, value]);

  const rows = useMemo(() => {
    const out: (CategoryDef | null)[][] = [];
    for (let i = 0; i < visible.length; i += COLUMNS) {
      const row: (CategoryDef | null)[] = visible.slice(i, i + COLUMNS);
      while (row.length < COLUMNS) row.push(null);
      out.push(row);
    }
    return out;
  }, [visible]);

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((c, ci) => {
            if (!c) return <View key={`pad-${ci}`} style={{ flex: 1 }} />;
            const active = c.id === value;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  hapticSelection();
                  onChange(c.id);
                }}
                style={({ pressed }) => [styles.tile, active && styles.tileActive, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={c.name}
              >
                <IconBadge Icon={c.icon} size={32} tint={active ? tint : colors.textSecondary} bg={active ? `${tint}22` : colors.surfaceSunken} />
                <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      {categories.length > initial ? (
        <Pressable
          style={styles.more}
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          {expanded ? <ChevronUp size={16} color={colors.primary} /> : <ChevronDown size={16} color={colors.primary} />}
          <Text style={styles.moreText}>
            {expanded ? t('common.less') : t('input.moreCategories', { n: categories.length - initial })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
