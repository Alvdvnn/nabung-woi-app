import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, X } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import type { ReportBucket } from '../../utils/report';
import { formatIDR } from '../../utils/format';
import { useT } from '../../i18n';

interface Props {
  bucket: ReportBucket;
  title: string;
  onView: () => void;
  onClose: () => void;
}

/** Inline panel under the trend chart for the tapped bar. */
export default function BucketDetail({ bucket, title, onView, onClose }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSunken,
          padding: spacing.md,
          gap: spacing.sm,
        },
        head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        title: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textPrimary },
        close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
        row: { flexDirection: 'row', gap: spacing.md },
        cell: { flex: 1, gap: 2 },
        label: { fontSize: fontSize.xs, color: colors.textMuted },
        value: { fontSize: fontSize.sm, fontWeight: weight.heavy },
        view: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
        viewText: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.primary },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <X size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('type.income')}</Text>
          <Text style={[styles.value, { color: colors.income }]} numberOfLines={1}>{formatIDR(bucket.income)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('type.expense')}</Text>
          <Text style={[styles.value, { color: colors.expense }]} numberOfLines={1}>{formatIDR(bucket.expense)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('report.txCount')}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{bucket.count}</Text>
        </View>
      </View>
      {bucket.count > 0 ? (
        <Pressable style={styles.view} onPress={onView} accessibilityRole="button">
          <Text style={styles.viewText}>{t('report.viewTransactions')}</Text>
          <ArrowRight size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
