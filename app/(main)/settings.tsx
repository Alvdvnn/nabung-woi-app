import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Database,
  Download,
  Languages,
  Lock,
  Moon,
  Plus,
  Smartphone,
  Sun,
  Tag,
  Trash,
  Upload,
  Wallet,
} from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import Button from '../../components/ui/Button';
import Sheet from '../../components/ui/Sheet';
import SegmentedControl, { Segment } from '../../components/ui/SegmentedControl';
import AccountManager from '../../components/account/AccountManager';
import CategoryManager from '../../components/category/CategoryManager';
import PinManager from '../../components/security/PinManager';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { usePin } from '../../context/PinContext';
import { useCategories } from '../../context/CategoriesContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../hooks/useToast';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { useLocale, useT } from '../../i18n';
import { Locale } from '../../i18n/dicts';
import { CustomCategory, clearAll, exportAll, importAll, getCustomCategories } from '../../utils/storage';
import { copyToClipboardOnWeb, downloadJsonOnWeb, pickJsonFileOnWeb } from '../../utils/webShare';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { accounts, saveAccounts, refresh: refreshData, resetCache } = useData();
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const { colors } = useTheme();
  const pin = usePin();
  const { refresh: refreshCategories } = useCategories();
  const t = useT();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          padding: spacing.lg,
          gap: spacing.xl,
          paddingBottom: contentBottomForFab(insets.bottom),
        },
        actionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.surface,
          minHeight: 52,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        danger: { borderColor: colors.expenseLight },
        actionText: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.textPrimary },
        importInput: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          color: colors.textPrimary,
          fontSize: fontSize.sm,
          minHeight: 140,
          maxHeight: 240,
          textAlignVertical: 'top',
        },
        modalMsg: { fontSize: fontSize.sm, color: colors.textSecondary },
      }),
    [colors, insets.bottom],
  );

  useFocusEffect(
    useCallback(() => {
      getCustomCategories().then(setCustomCats);
    }, []),
  );

  async function handleExport() {
    try {
      const json = await exportAll();
      if (Platform.OS === 'web') {
        const stamp = new Date().toISOString().slice(0, 10);
        const downloaded = downloadJsonOnWeb(`nabung-woi-${stamp}.json`, json);
        const copied = await copyToClipboardOnWeb(json);
        if (downloaded) toast.show('success', t('settings.exportDownloaded'));
        else if (copied) toast.show('success', t('settings.exportCopied'));
        else toast.show('error', t('settings.exportFailed'));
        return;
      }
      await Share.share({ message: json, title: t('settings.exportShareTitle') });
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
      setCustomCats(await getCustomCategories());
      await refreshData();
      await refreshCategories();
      toast.show(
        'success',
        t('settings.importSuccess', {
          tx: summary.transactions,
          acc: summary.accounts,
          cat: summary.categories,
        }),
      );
      if (summary.orphanTransactions > 0) {
        toast.show('info', t('settings.importOrphans', { n: summary.orphanTransactions }));
      }
      setImportText('');
      setImportOpen(false);
    } catch (e: any) {
      toast.show(
        'error',
        e?.message === 'invalidJson' ? t('settings.importInvalidJson') : t('settings.importInvalidShape'),
      );
    } finally {
      setImporting(false);
    }
  }

  async function doClearAll() {
    setClearing(true);
    await clearAll();
    resetCache();
    setCustomCats([]);
    await refreshCategories();
    setClearing(false);
    setConfirmClear(false);
    toast.show('success', t('settings.allCleared'));
  }

  return (
    <Screen>
      <TopBar title={t('settings.title')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section Icon={Wallet} title={t('settings.accounts')}>
          <AccountManager accounts={accounts} onChange={saveAccounts} />
        </Section>

        <Section Icon={Tag} title={t('settings.categories')}>
          <CategoryManager categories={customCats} onChange={setCustomCats} />
        </Section>

        <Section Icon={Database} title={t('settings.data')}>
          <Pressable style={styles.actionRow} onPress={handleExport} accessibilityRole="button">
            <Download size={18} color={colors.primary} />
            <Text style={styles.actionText}>{t('settings.exportData')}</Text>
          </Pressable>
          <Pressable style={styles.actionRow} onPress={() => setImportOpen(true)} accessibilityRole="button">
            <Upload size={18} color={colors.primary} />
            <Text style={styles.actionText}>{t('settings.importData')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionRow, styles.danger]}
            onPress={() => setConfirmClear(true)}
            accessibilityRole="button"
          >
            <Trash size={18} color={colors.expense} />
            <Text style={[styles.actionText, { color: colors.expense }]}>{t('settings.clearData')}</Text>
          </Pressable>
        </Section>

        <Section Icon={Lock} title={t('settings.security')}>
          <PinManager onChange={pin.refresh} />
        </Section>

        <Section Icon={Sun} title={t('settings.appearance')}>
          <AppearanceRow />
        </Section>

        <Section Icon={Languages} title={t('settings.language')}>
          <LanguageRow />
        </Section>
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />

      <Sheet
        visible={importOpen}
        title={t('settings.importTitle')}
        onClose={() => setImportOpen(false)}
        scroll
      >
        <View style={{ gap: spacing.md }}>
          <Text style={styles.modalMsg}>{t('settings.importMsg')}</Text>
          {Platform.OS === 'web' ? (
            <Pressable
              style={[styles.actionRow, { borderColor: colors.primary }]}
              onPress={handlePickImportFile}
              accessibilityRole="button"
            >
              <Upload size={18} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {t('settings.importPickFile')}
              </Text>
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
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={() => setImportOpen(false)}
              fullWidth
            />
            <Button
              label={t('settings.importBtn')}
              onPress={doImport}
              loading={importing}
              disabled={!importText.trim()}
              fullWidth
            />
          </View>
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

function Section({ Icon, title, children }: { Icon: any; title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { gap: spacing.md },
        header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        title: { fontSize: fontSize.lg, fontWeight: weight.bold, color: colors.textPrimary },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Icon size={18} color={colors.primary} />
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function AppearanceRow() {
  const { mode, setMode } = useTheme();
  const t = useT();
  const options = useMemo<Segment<ThemeMode>[]>(
    () => [
      { id: 'system', label: t('settings.system'), Icon: Smartphone },
      { id: 'light', label: t('settings.light'), Icon: Sun },
      { id: 'dark', label: t('settings.dark'), Icon: Moon },
    ],
    [t],
  );
  return <SegmentedControl options={options} value={mode} onChange={setMode} />;
}

function LanguageRow() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const options = useMemo<Segment<Locale>[]>(
    () => [
      { id: 'en', label: t('settings.english') },
      { id: 'id', label: t('settings.indonesian') },
    ],
    [t],
  );
  return <SegmentedControl options={options} value={locale} onChange={setLocale} />;
}
