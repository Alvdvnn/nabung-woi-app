import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DatePickerField from '../components/DatePickerField';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForFullScreen } from '../constants/layout';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  getLastAccount,
  setLastAccount,
  TransactionType,
} from '../utils/storage';
import { useData, useTransactions } from '../context/DataContext';
import { accountBalance } from '../utils/aggregate';
import { genId } from '../utils/id';
import { isoDay } from '../utils/format';

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

  const { accounts, findTx, addTx, updateTx } = useData();
  const txs = useTransactions(); // needed for the transfer balance check

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [fromPickerOpen, setFromPickerOpen] = useState(false);
  const [toPickerOpen, setToPickerOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [hydrated, setHydrated] = useState(!editId);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        refreshCategories();

        if (editId) {
          const tx = findTx(editId);
          if (tx) {
            setType(tx.type);
            setAmount(String(tx.amount));
            setCategoryId(tx.categoryId);
            setNote(tx.note);
            setAccountId(tx.accountId);
            setToAccountId(tx.toAccountId ?? null);
            setSelectedDate(new Date(tx.date));
            setHydrated(true);
            return;
          }
        }
        
        const last = await getLastAccount();
        const id = last && accounts.find((a) => a.id === last) ? last : accounts[0]?.id ?? null;
        setAccountId(id);
        
        if (accounts.length > 1) {
          const possibleTo = accounts.find((a) => a.id !== id);
          if (possibleTo) setToAccountId(possibleTo.id);
        }
        
        setHydrated(true);
      })();
    }, [editId, refreshCategories, findTx, accounts])
  );

  const categories = useMemo(() => {
    if (type === 'transfer') return [];
    return byType(type);
  }, [byType, type]);

  useEffect(() => {
    if (isEditing) return;
    if (type === 'transfer') {
      setCategoryId('transfer');
      return;
    }
    if (categories.length === 0) return;
    if (!categories.find((c) => c.id === categoryId)) setCategoryId(categories[0].id);
  }, [categoryId, isEditing, categories, type]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  function resetForm() {
    setAmount('');
    setNote('');
    setSelectedDate(new Date());
  }

  function resolveReturnTarget(): '/calendar' | '/history' | '/dashboard' {
    if (returnTo === 'calendar') return '/calendar';
    if (returnTo === 'history') return '/history';
    return '/dashboard';
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.show('error', t('input.errInvalidAmount')); return; }
    if (!accountId) { toast.show('error', t('input.errNoAccount')); return; }
    
    if (type === 'transfer') {
      if (!toAccountId) { toast.show('error', t('input.errNoDestination')); return; }
      if (accountId === toAccountId) { toast.show('error', t('input.errSameAccount')); return; }
      if (!selectedAccount) { toast.show('error', t('input.errNoAccount')); return; }

      // Available balance via the shared helper. When editing this transfer,
      // add the old amount back so the source still counts as having it.
      let available = accountBalance(selectedAccount, txs);
      if (isEditing && editId) {
        const oldTx = findTx(editId);
        if (oldTx && oldTx.accountId === accountId) available += oldTx.amount;
      }

      if (num > available) {
        toast.show('error', t('input.errInsufficientBalance'));
        return;
      }
    }

    setSaving(true);
    const dayKey = isoDay(selectedDate);
    
    const txData = {
      type,
      amount: num,
      categoryId: type === 'transfer' ? 'transfer' : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? (toAccountId as string) : undefined,
      note: note.trim(),
      date: selectedDate.toISOString(),
      dayKey,
    };

    try {
      if (isEditing && editId) {
        await updateTx({ id: editId, ...txData });
        toast.show('success', t('input.txUpdated'));
        router.replace(resolveReturnTarget());
      } else {
        await addTx({ id: genId('t'), ...txData });
        await setLastAccount(accountId);
        resetForm();

        const successMsg = type === 'transfer'
          ? t('input.transferRecorded')
          : (type === 'income' ? t('input.incomeRecorded') : t('input.expenseRecorded'));

        toast.show('success', successMsg);
      }
    } catch {
      toast.show('error', t('input.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setConfirmCancel(true);
  }

  function doCancelEdit() {
    setConfirmCancel(false);
    router.replace(resolveReturnTarget());
  }

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
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
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <TopBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <TopBar />
      <KeyboardAvoidingView
        style={styles.flex}
        // Android runs edge-to-edge (window does not resize for the keyboard),
        // so KeyboardAvoidingView must pad on both platforms or the last field
        // (note) ends up hidden behind the keyboard.
        behavior="padding"
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
            <AmountInput value={amount} onChange={setAmount} autoFocus={!isEditing && Platform.OS !== 'web'} />
          </View>

          {type !== 'transfer' && (
            <>
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
            </>
          )}

          {type === 'transfer' ? (
            <>
              <Text style={styles.label}>{t('input.fromAccount')}</Text>
              <Pressable style={styles.accountPill} onPress={() => setFromPickerOpen(true)}>
                <Text style={styles.accountText}>
                  {selectedAccount ? selectedAccount.name : t('input.selectAccount')}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </Pressable>

              <Text style={styles.label}>{t('input.toAccount')}</Text>
              <Pressable style={styles.accountPill} onPress={() => setToPickerOpen(true)}>
                <Text style={styles.accountText}>
                  {selectedToAccount ? selectedToAccount.name : t('input.selectAccount')}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>{t('input.account')}</Text>
              <Pressable style={styles.accountPill} onPress={() => setFromPickerOpen(true)}>
                <Text style={styles.accountText}>
                  {selectedAccount ? selectedAccount.name : t('input.selectAccount')}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </Pressable>
            </>
          )}

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
            onFocus={() => {
              // Wait for keyboard up before scrolling, instead of a brittle 100ms timer.
              const sub = Keyboard.addListener('keyboardDidShow', () => {
                scrollRef.current?.scrollToEnd({ animated: true });
                sub.remove();
              });
            }}
          />

          <View style={styles.actions}>
            {isEditing && (
              <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled, isEditing && styles.flex]}
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
        visible={fromPickerOpen}
        accounts={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        onClose={() => setFromPickerOpen(false)}
      />

      <AccountPickerSheet
        visible={toPickerOpen}
        accounts={accounts}
        selectedId={toAccountId}
        onSelect={setToAccountId}
        onClose={() => setToPickerOpen(false)}
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
