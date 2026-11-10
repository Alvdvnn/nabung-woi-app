import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HardDriveDownload, X } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { usePrefs } from '../../context/PrefsContext';
import { useData } from '../../context/DataContext';
import { addDays, daysBetween } from '../../utils/date';
import { useT } from '../../i18n';

const NUDGE_AFTER_DAYS = 30;
const SNOOZE_DAYS = 30;

/** One-line reminder to export a backup, shown after 30 days without one. */
export default function BackupNudge() {
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const { prefs, hydrated, updatePrefs } = usePrefs();
  const { txs } = useData();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.infoLight,
          borderRadius: radius.md,
          paddingLeft: spacing.md,
          paddingRight: spacing.xs,
          minHeight: 48,
        },
        text: { flex: 1, fontSize: fontSize.sm, color: colors.info, fontWeight: weight.semibold },
        close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
      }),
    [colors],
  );

  if (!hydrated || txs.length < 10) return null;
  const now = new Date();
  if (prefs.backupNudgeSnoozedUntil && new Date(prefs.backupNudgeSnoozedUntil) > now) return null;
  const last = prefs.lastExportAt ? new Date(prefs.lastExportAt) : null;
  const oldestTx = txs[txs.length - 1];
  const since = last ?? (oldestTx ? new Date(oldestTx.date) : now);
  if (daysBetween(since, now) < NUDGE_AFTER_DAYS) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <HardDriveDownload size={18} color={colors.info} />
      <Pressable style={{ flex: 1, minHeight: 44, justifyContent: 'center' }} onPress={() => router.push('/settings/data')} accessibilityRole="button">
        <Text style={styles.text}>{last ? t('backup.nudgeOld', { n: daysBetween(last, now) }) : t('backup.nudgeNever')}</Text>
      </Pressable>
      <Pressable
        style={styles.close}
        onPress={() => updatePrefs({ backupNudgeSnoozedUntil: addDays(now, SNOOZE_DAYS).toISOString() })}
        accessibilityRole="button"
        accessibilityLabel={t('backup.dismiss')}
      >
        <X size={16} color={colors.info} />
      </Pressable>
    </View>
  );
}
