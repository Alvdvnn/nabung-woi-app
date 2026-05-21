import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DatePickerField from '../components/DatePickerField';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForFullScreen } from '../constants/layout';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useToast } from '../hooks/useToast';
import { ChevronDown } from 'lucide-react-native';
import TopBar from '../components/TopBar';
import Fab from '../components/Fab';
import TypeToggle from '../components/TypeToggle';
import AmountInput from '../components/AmountInput';
import CategoryChip from '../components/CategoryChip';
import AccountPickerSheet from '../components/AccountPickerSheet';
import ConfirmModal from '../components/ConfirmModal';
import { radius, spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useCategories } from '../context/CategoriesContext';
import { useT } from '../i18n';
import {
  addTransaction,
  getAccounts,
  getLastAccount,
  getTransaction,
  setLastAccount,
  updateTransaction,
  Account,
  TransactionType,
} from '../utils/storage';
import { genId } from '../utils/id';

export default function InputScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const scrollRef = useRef<ScrollView>(null);
  const { id: editId, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const isEditing = !!editId;
  const { byType, refresh: refreshCategories } = useCategories();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(byType('expense')[0].id);
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [hydrated, setHydrated] = useState(!editId);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        refreshCategories();
        const accs = await getAccounts();
        setAccounts(accs);

        if (editId) {
          const tx = await getTransaction(editId);
          if (tx) {
            setType(tx.type);
            setAmount(String(tx.amount));
            setCategoryId(tx.categoryId);
            setNote(tx.note);
            setAccountId(tx.accountId);
            setSelectedDate(new Date(tx.date));
            setHydrated(true);
            return;
          }
        }
        const last = await getLastAccount();
        const id = last && accs.find((a) => a.id === last) ? last : accs[0]?.id ?? null;
        setAccountId(id);
        setHydrated(true);
      })();
    }, [editId, refreshCategories])
  );

  const categories = useMemo(() => byType(type), [byType, type]);

  useEffect(() => {
    if (isEditing) return;
    if (!categories.find((c) => c.id === categoryId)) setCategoryId(categories[0].id);
  }, [categoryId, isEditing, categories]);

  const selectedAccount = accounts.find((a) => a.id === accountId);

  function resetForm() {
    setAmount('');
    setNote('');
    setSelectedDate(new Date());
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.show('error', t('input.errInvalidAmount')); return; }
    if (!accountId) { toast.show('error', t('input.errNoAccount')); return; }

    setSaving(true);
    if (isEditing && editId) {
      await updateTransaction({
        id: editId,
        type,
        amount: num,
        categoryId,
        accountId,
        note: note.trim(),
        date: selectedDate.toISOString(),
      });
      setSaving(false);
      toast.show('success', t('input.txUpdated'));
      const target = returnTo === 'calendar' ? '/calendar' : returnTo === 'history' ? '/history' : '/dashboard';
      router.replace(target);
    } else {
      await addTransaction({
        id: genId('t'),
        type,
        amount: num,
        categoryId,
        accountId,
        note: note.trim(),
        date: selectedDate.toISOString(),
      });
      await setLastAccount(accountId);
      resetForm();
      setSaving(false);
      toast.show('success', type === 'income' ? t('input.incomeRecorded') : t('input.expenseRecorded'));
    }
  }

  function handleCancelEdit() {
    setConfirmCancel(true);
  }

  function doCancelEdit() {
    setConfirmCancel(false);
    const target = returnTo === 'calendar' ? '/calendar' : returnTo === 'history' ? '/history' : '/dashboard';
    router.replace(target);
  }

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    flex1: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: 160 },
    heading: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary },
    subheading: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
    label: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    cats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    accountPill: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '500' },
    noteInput: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
    saveBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.white },
    cancelBtn: {
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    cancelBtnText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  }), [colors]);

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>{isEditing ? t('input.headingEdit') : t('input.headingAdd')}</Text>
          <Text style={styles.subheading}>
            {isEditing ? t('input.subEdit') : t('input.subAdd')}
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <TypeToggle value={type} onChange={setType} />
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.label}>{t('input.amount')}</Text>
            <AmountInput value={amount} onChange={setAmount} autoFocus={!isEditing} />
          </View>

          <Text style={styles.label}>{t('input.category')}</Text>
          <View style={styles.cats}>
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                Icon={c.icon}
                active={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </View>

          <Text style={styles.label}>{t('input.account')}</Text>
          <Pressable style={styles.accountPill} onPress={() => setPickerOpen(true)}>
            <Text style={styles.accountText}>
              {selectedAccount ? selectedAccount.name : t('input.selectAccount')}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.label}>{t('input.date')}</Text>
          <DatePickerField value={selectedDate} onChange={setSelectedDate} />

          <Text style={styles.label}>{t('input.note')}</Text>
          <TextInput
            style={styles.noteInput}
            placeholder={t('input.notePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={80}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
          />

          <View style={styles.actions}>
            {isEditing && (
              <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled, isEditing && styles.flex1]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? t('input.saving') : isEditing ? t('input.update') : t('input.saveTransaction')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!isEditing && <Fab bottom={fabBottomForFullScreen(insets.bottom)} onPress={() => router.push('/dashboard')} />}

      <AccountPickerSheet
        visible={pickerOpen}
        accounts={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmModal
        visible={confirmCancel}
        title={t('input.discardTitle')}
        message={t('input.discardMsg')}
        confirmLabel={t('input.discard')}
        cancelLabel={t('input.keepEditing')}
        tone="danger"
        onConfirm={doCancelEdit}
        onCancel={() => setConfirmCancel(false)}
      />
    </SafeAreaView>
  );
}
