import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Database, Download, Trash, Wallet, Tag, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import AccountManager from '../../components/AccountManager';
import CategoryManager from '../../components/CategoryManager';
import { colors, radius, spacing, fontSize } from '../../constants/theme';
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAccounts().then(setAccounts);
      getCustomCategories().then(setCustomCats);
    }, [])
  );

  async function handleExport() {
    const json = await exportAll();
    try {
      await Share.share({ message: json, title: 'Nabung Woi Export' });
    } catch (e) {
      Alert.alert('Export failed');
    }
  }

  function handleClear() {
    Alert.alert('Clear all data?', 'This deletes all transactions, accounts, and categories. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          setAccounts([]);
          setCustomCats([]);
          Alert.alert('Data cleared');
        },
      },
    ]);
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
          <Pressable style={[styles.actionRow, styles.danger]} onPress={handleClear}>
            <Trash size={18} color={colors.expense} />
            <Text style={[styles.actionText, { color: colors.expense }]}>Clear all data</Text>
          </Pressable>
        </Section>
      </ScrollView>
      <Fab Icon={Plus} bottom={80} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}

function Section({ Icon, title, children }: { Icon: any; title: string; children: React.ReactNode }) {
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  danger: { borderColor: colors.expenseLight },
  actionText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
});
