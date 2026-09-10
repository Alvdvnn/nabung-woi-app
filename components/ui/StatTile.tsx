import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export interface TrendInfo {
  /** Percent change vs the comparison period; null hides the trend chip. */
  percent: number | null;
  /** Whether a rise is a good thing (income) or a bad thing (expense). */
  goodWhen: 'up' | 'down';
}

interface Props {
  label: string;
  value: string;
  Icon?: LucideIcon;
  tone?: 'neutral' | 'income' | 'expense' | 'primary' | 'adjustment';
  caption?: string;
  trend?: TrendInfo;
  style?: StyleProp<ViewStyle>;
}

export default function StatTile({ label, value, Icon, tone = 'neutral', caption, trend, style }: Props) {
  const { colors } = useTheme();

  const accent = useMemo(() => {
    switch (tone) {
      case 'income':
        return { fg: colors.income, bg: colors.incomeLight };
      case 'expense':
        return { fg: colors.expense, bg: colors.expenseLight };
      case 'primary':
        return { fg: colors.primary, bg: colors.primarySoft };
      case 'adjustment':
        return { fg: colors.adjustment, bg: colors.adjustmentLight };
      default:
        return { fg: colors.textPrimary, bg: colors.surfaceSunken };
    }
  }, [tone, colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tile: {
          flex: 1,
          minWidth: 140,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        },
        head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        icon: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent.bg,
        },
        label: { flex: 1, fontSize: fontSize.xs, fontWeight: weight.bold, color: colors.textSecondary },
        value: { fontSize: fontSize.xl, fontWeight: weight.black, color: accent.fg, letterSpacing: -0.4 },
        caption: { fontSize: fontSize.xs, color: colors.textMuted },
        trend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
        trendText: { fontSize: fontSize.xs, fontWeight: weight.bold },
      }),
    [colors, accent],
  );

  const showTrend = trend && trend.percent !== null && Number.isFinite(trend.percent);
  const pct = showTrend ? (trend as TrendInfo).percent! : 0;
  const rising = pct > 0;
  const flat = Math.abs(pct) < 0.5;
  const good = flat ? null : (rising ? trend?.goodWhen === 'up' : trend?.goodWhen === 'down');
  const trendColor = good === null ? colors.textMuted : good ? colors.income : colors.expense;
  const TrendIcon = flat ? Minus : rising ? ArrowUpRight : ArrowDownRight;

  return (
    <View style={[styles.tile, style]}>
      <View style={styles.head}>
        {Icon ? (
          <View style={styles.icon}>
            <Icon size={16} color={accent.fg} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      {showTrend ? (
        <View style={styles.trend}>
          <TrendIcon size={13} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {`${Math.abs(pct).toFixed(0)}%`}
          </Text>
          {caption ? <Text style={styles.caption}> {caption}</Text> : null}
        </View>
      ) : caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
