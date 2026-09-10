import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CircleDollarSign } from 'lucide-react-native';
import { chartPalette, fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useCategories } from '../../context/CategoriesContext';
import { CategorySum } from '../../utils/aggregate';
import { formatIDR } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  data: CategorySum[];
  total: number;
  /** Caps the list; the remainder is folded into a single "Other" row. */
  max?: number;
  onPress?: (categoryId: string) => void;
  emptyLabel: string;
}

/**
 * Ranked category breakdown. A bar per row reads faster than a pie for
 * comparing more than a few categories, and it stays legible at any list length.
 */
export default function CategoryBars({ data, total, max = 8, onPress, emptyLabel }: Props) {
  const { colors, resolved } = useTheme();
  const { find } = useCategories();
  const t = useT();
  const palette = chartPalette(resolved);

  const rows = useMemo(() => {
    if (data.length <= max) return data;
    const head = data.slice(0, max);
    const tail = data.slice(max).reduce((sum, d) => sum + d.total, 0);
    return tail > 0 ? [...head, { categoryId: '__other__', total: tail }] : head;
  }, [data, max]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
        icon: {
          width: 34,
          height: 34,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceSunken,
        },
        main: { flex: 1, gap: 6 },
        head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        name: { flex: 1, fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textPrimary },
        amount: { fontSize: fontSize.sm, fontWeight: weight.heavy, color: colors.textPrimary },
        pct: { width: 38, textAlign: 'right', fontSize: fontSize.xs, color: colors.textMuted, fontWeight: weight.semibold },
        track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
        fill: { height: '100%', borderRadius: 3 },
        empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
      }),
    [colors],
  );

  if (rows.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {rows.map((row, i) => {
        const isOther = row.categoryId === '__other__';
        const cat = isOther ? undefined : find(row.categoryId);
        const Icon = cat?.icon ?? CircleDollarSign;
        const name = isOther ? t('pie.other') : (cat?.name ?? t('common.other'));
        const pct = total > 0 ? (row.total / total) * 100 : 0;
        const color = isOther ? colors.textMuted : palette[i % palette.length];

        const content = (
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: `${color}22` }]}>
              <Icon size={16} color={color} />
            </View>
            <View style={styles.main}>
              <View style={styles.head}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.amount}>{formatIDR(row.total)}</Text>
                <Text style={styles.pct}>{`${Math.round(pct)}%`}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(2, pct)}%`, backgroundColor: color }]} />
              </View>
            </View>
          </View>
        );

        if (!onPress || isOther) return <View key={row.categoryId}>{content}</View>;

        return (
          <Pressable
            key={row.categoryId}
            onPress={() => onPress(row.categoryId)}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${formatIDR(row.total)}`}
            style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}
