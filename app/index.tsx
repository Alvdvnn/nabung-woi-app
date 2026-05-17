import { useCallback, useEffect, useState } from 'react';
import DatePickerField from '../components/DatePickerField';
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
import { colors, radius, spacing, fontSize } from '../constants/theme';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
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

export default function InputScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id: editId, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const isEditing = !!editId;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(EXPENSE_CATEGORIES[0].id);
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
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
            return;
          }
        }
        const last = await getLastAccount();
        const id = last && accs.find((a) => a.id === last) ? last : accs[0]?.id ?? null;
        setAccountId(id);
      })();
    }, [editId])
  );

  useEffect(() => {
    if (isEditing) return;
    const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!list.find((c) => c.id === categoryId)) setCategoryId(list[0].id);
  }, [type, categoryId, isEditing]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedAccount = accounts.find((a) => a.id === accountId);

  function resetForm() {
    setAmount('');
    setNote('');
    setSelectedDate(new Date());
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.show('error', 'Enter a valid amount'); return; }
    if (!accountId) { toast.show('error', 'Add an account first'); return; }

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
      toast.show('success', 'Transaction updated');
      const target = returnTo === 'calendar' ? '/calendar' : returnTo === 'history' ? '/history' : '/dashboard';
      setTimeout(() => router.replace(target), 200);
    } else {
      await addTransaction({
        id: Date.now().toString(),
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
      toast.show('success', `${type === 'income' ? 'Income' : 'Expense'} recorded`);
    }
  }

  function handleCancelEdit() {
    const target = returnTo === 'calendar' ? '/calendar' : returnTo === 'history' ? '/history' : '/dashboard';
    router.replace(target);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
          <Text style={styles.subheading}>
            {isEditing ? 'Update any field, then save.' : 'Quick log — no extra clicks.'}
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <TypeToggle value={type} onChange={setType} />
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.label}>Amount</Text>
            <AmountInput value={amount} onChange={setAmount} autoFocus={!isEditing} />
          </View>

          <Text style={styles.label}>Category</Text>
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

          <Text style={styles.label}>Account</Text>
          <Pressable style={styles.accountPill} onPress={() => setPickerOpen(true)}>
            <Text style={styles.accountText}>
              {selectedAccount ? selectedAccount.name : 'Select account'}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.label}>Date</Text>
          <DatePickerField value={selectedDate} onChange={setSelectedDate} />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What was this for?"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={80}
          />

          <View style={styles.actions}>
            {isEditing && (
              <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled, isEditing && styles.flex1]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving…' : isEditing ? 'Update' : 'Save Transaction'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!isEditing && <Fab onPress={() => router.push('/dashboard')} />}

      <AccountPickerSheet
        visible={pickerOpen}
        accounts={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
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
});
