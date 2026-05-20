import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import { Database, Download, Trash, Wallet, Tag, Plus, Sun, Moon, Lock } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import AccountManager from '../../components/AccountManager';
import CategoryManager from '../../components/CategoryManager';
import PinManager from '../../components/PinManager';
import ConfirmModal from '../../components/ConfirmModal';
import { usePin } from '../../context/PinContext';
import { useToast } from '../../hooks/useToast';
import { radius, spacing, fontSize } from '../../constants/theme';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import {
  Account,
  CustomCategory,
  clearAll,
  exportAll,
  getAccounts,
  getCustomCategories,
} from '../../utils/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { colors } = useTheme();
  const pin = usePin();
  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
    actionRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: colors.card,
      padding: spacing.md, borderRadius: radius.md,
      borderWidth: 1, borderColor: colors.border,
    },
    danger: { borderColor: colors.expenseLight },
    actionText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  }), [colors]);

  useFocusEffect(
    useCallback(() => {
      getAccounts().then(setAccounts);
      getCustomCategories().then(setCustomCats);
    }, [])
  );

  async function handleExport() {
    try {
      const json = await exportAll();
      await Share.share({ message: json, title: 'Nabung Woi Export' });
    } catch {
      toast.show('error', 'Export failed');
    }
  }

  async function doClearAll() {
    setClearing(true);
    await clearAll();
    setAccounts([]);
    setCustomCats([]);
    setClearing(false);
    setConfirmClear(false);
    toast.show('success', 'All data cleared');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Settings" showLogo={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section Icon={Wallet} title="Accounts">
          <AccountManager accounts={accounts} onChange={setAccounts} />
        </Section>

        <Section Icon={Tag} title="Categories">
          <CategoryManager categories={customCats} onChange={setCustomCats} />
        </Section>

        <Section Icon={Database} title="Data">
          <Pressable style={styles.actionRow} onPress={handleExport}>
            <Download size={18} color={colors.primary} />
            <Text style={styles.actionText}>Export data (JSON)</Text>
          </Pressable>
          <Pressable style={[styles.actionRow, styles.danger]} onPress={() => setConfirmClear(true)}>
            <Trash size={18} color={colors.expense} />
            <Text style={[styles.actionText, { color: colors.expense }]}>Clear all data</Text>
          </Pressable>
        </Section>

        <Section Icon={Lock} title="Security">
          <PinManager onChange={pin.refresh} />
        </Section>

        <Section Icon={Sun} title="Appearance">
          <AppearanceRow />
        </Section>
      </ScrollView>
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />

      <ConfirmModal
        visible={confirmClear}
        title="Clear all data?"
        message="This deletes all transactions, accounts, and categories. This cannot be undone."
        confirmLabel="Clear all"
        tone="danger"
        busy={clearing}
        onConfirm={doClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </SafeAreaView>
  );
}

function Section({ Icon, title, children }: { Icon: any; title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    section: { gap: spacing.md },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  }), [colors]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function AppearanceRow() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    option: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      gap: 6,
    },
    optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    labelActive: { color: colors.primary },
  }), [colors]);

  const opts: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
  ];

  return (
    <View style={styles.row}>
      {opts.map((o) => {
        const active = mode === o.id;
        return (
          <Pressable key={o.id} style={[styles.option, active && styles.optionActive]} onPress={() => setMode(o.id)}>
            <o.Icon size={20} color={active ? colors.primary : colors.textSecondary} />
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
