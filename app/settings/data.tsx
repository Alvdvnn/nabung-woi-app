import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, Trash, Upload } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Button from '../../components/ui/Button';
import Sheet from '../../components/ui/Sheet';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { usePrefs } from '../../context/PrefsContext';
import { clearAll, exportAll, importAll } from '../../utils/storage';
import { copyToClipboardOnWeb, downloadJsonOnWeb, pickJsonFileOnWeb } from '../../utils/webShare';
import { formatDate } from '../../utils/format';
import { daysBetween } from '../../utils/date';
import { useT } from '../../i18n';

export default function DataSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const { refresh: refreshData, resetCache } = useData();
  const { refresh: refreshCategories } = useCategories();
  const { prefs, updatePrefs, refresh: refreshPrefs } = usePrefs();

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        importInput: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          color: colors.textPrimary,
          fontSize: fontSize.input,
          minHeight: 140,
          maxHeight: 240,
          textAlignVertical: 'top',
        },
        modalMsg: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
        pickBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.primary,
          borderStyle: 'dashed',
        },
        pickText: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.primary },
      }),
    [colors, insets.bottom],
  );

  const lastBackup = prefs.lastExportAt ? new Date(prefs.lastExportAt) : null;
  const backupAge = lastBackup ? daysBetween(lastBackup, new Date()) : null;
  const backupText = lastBackup
    ? t('settings.lastBackup', { date: formatDate(lastBackup.toISOString()), days: backupAge ?? 0 })
    : t('settings.lastBackupNever');

  async function handleExport() {
    try {
      const json = await exportAll();
      let ok = false;
      if (Platform.OS === 'web') {
        const stamp = new Date().toISOString().slice(0, 10);
        const downloaded = downloadJsonOnWeb(`nabung-woi-${stamp}.json`, json);
        const copied = downloaded ? false : await copyToClipboardOnWeb(json);
        if (downloaded) toast.show('success', t('settings.exportDownloaded'));
        else if (copied) toast.show('success', t('settings.exportCopied'));
        else toast.show('error', t('settings.exportFailed'));
        ok = downloaded || copied;
      } else {
        const res = await Share.share({ message: json, title: t('settings.exportShareTitle') });
        ok = res.action !== Share.dismissedAction;
      }
      if (ok) await updatePrefs({ lastExportAt: new Date().toISOString(), backupNudgeSnoozedUntil: undefined });
    } catch {
      toast.show('error', t('settings.exportFailed'));
    }
  }

  async function handlePickImportFile() {
    const text = await pickJsonFileOnWeb();
    if (text == null) return;
    if (!text.trim()) {
      toast.show('error', t('settings.importReadFailed'));
      return;
    }
    setImportText(text);
  }

  async function doImport() {
    setImporting(true);
    try {
      const summary = await importAll(importText);
      await refreshData();
      await refreshCategories();
      await refreshPrefs();
      toast.show('success', t('settings.importSuccess', { tx: summary.transactions, acc: summary.accounts, cat: summary.categories }));
      if (summary.orphanTransactions > 0) toast.show('info', t('settings.importOrphans', { n: summary.orphanTransactions }));
      setImportText('');
      setImportOpen(false);
    } catch (e: any) {
      toast.show('error', e?.message === 'invalidJson' ? t('settings.importInvalidJson') : t('settings.importInvalidShape'));
    } finally {
      setImporting(false);
    }
  }

  async function doClearAll() {
    setClearing(true);
    await clearAll();
    resetCache();
    await refreshCategories();
    await refreshPrefs();
    setClearing(false);
    setConfirmClear(false);
    toast.show('success', t('settings.allCleared'));
  }

  return (
    <Screen>
      <TopBar title={t('settings.data')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionGroup title={t('settings.backup')} footer={t('settings.backupHint')}>
          <ListRow Icon={Download} title={t('settings.exportData')} subtitle={backupText} trailing="chevron" onPress={handleExport} />
          <ListRow Icon={Upload} title={t('settings.importData')} subtitle={t('settings.importSub')} trailing="chevron" onPress={() => setImportOpen(true)} />
        </SectionGroup>

        <SectionGroup title={t('settings.dangerZone')} footer={t('settings.clearHint')}>
          <ListRow Icon={Trash} title={t('settings.clearData')} tone="danger" trailing="chevron" onPress={() => setConfirmClear(true)} />
        </SectionGroup>
        <View />
      </ScrollView>

      <Sheet
        visible={importOpen}
        title={t('settings.importTitle')}
        onClose={() => setImportOpen(false)}
        scroll
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label={t('common.cancel')} variant="secondary" onPress={() => setImportOpen(false)} fullWidth />
            <Button label={t('settings.importBtn')} onPress={doImport} loading={importing} disabled={!importText.trim()} fullWidth />
          </View>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Text style={styles.modalMsg}>{t('settings.importMsg')}</Text>
          {Platform.OS === 'web' ? (
            <Pressable style={styles.pickBtn} onPress={handlePickImportFile} accessibilityRole="button">
              <Upload size={18} color={colors.primary} />
              <Text style={styles.pickText}>{t('settings.importPickFile')}</Text>
            </Pressable>
          ) : null}
          <TextInput
            style={styles.importInput}
            value={importText}
            onChangeText={setImportText}
            placeholder={t('settings.importPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t('settings.importTitle')}
          />
        </View>
      </Sheet>

      <ConfirmModal
        visible={confirmClear}
        title={t('settings.clearTitle')}
        message={t('settings.clearMsg')}
        confirmLabel={t('settings.clearConfirm')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={clearing}
        onConfirm={doClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </Screen>
  );
}
