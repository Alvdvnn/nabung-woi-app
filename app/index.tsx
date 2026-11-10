import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, CalendarDays, Info, Minus, Plus, Wallet } from 'lucide-react-native';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import Button from '../components/ui/Button';
import ListRow from '../components/ui/ListRow';
import SectionGroup from '../components/ui/SectionGroup';
import TypeToggle from '../components/transaction/TypeToggle';
import AmountInput from '../components/transaction/AmountInput';
import CategoryGrid from '../components/transaction/CategoryGrid';
import DateSheet from '../components/transaction/DateSheet';
import AccountPickerSheet from '../components/account/AccountPickerSheet';
import ConfirmModal from '../components/feedback/ConfirmModal';
import { fontSize, radius, spacing, weight } from '../constants/theme';
import { findAccountType } from '../constants/accountTypes';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { useCategoryUsage, sortByUsage } from '../hooks/useCategoryUsage';
import { useCategories } from '../context/CategoriesContext';
import { useData } from '../context/DataContext';
import { usePrefs } from '../context/PrefsContext';
import { useT } from '../i18n';
import { tBuiltin } from '../i18n/labels';
import { AdjustmentDirection, TransactionType, getLastAccount, setLastAccount } from '../utils/storage';
import { isoDay, parseIsoDay } from '../utils/date';
import { balanceDelta } from '../utils/aggregate';
import { formatDateLong, formatIDR, formatTime } from '../utils/format';
import { genId } from '../utils/id';

type ReturnTarget = '/calendar' | '/history' | '/dashboard' | '/report';

const TYPES: TransactionType[] = ['expense', 'income', 'transfer', 'adjustment'];
const FOOTER_HEIGHT = 76;

export default function InputScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardInset();
  const { colors } = useTheme();
  const t = useT();
  const params = useLocalSearchParams<{
    id?: string;
    returnTo?: string;
    date?: string;
    // Prefill (quick add from the dashboard). Nothing is saved until the user taps Save.
    type?: string;
    amount?: string;
    categoryId?: string;
    accountId?: string;
    note?: string;
  }>();
  const { id: editId, returnTo, date: dateParam } = params;
  const isEditing = !!editId;
  const { byType, refresh: refreshCategories } = useCategories();
  const { prefs } = usePrefs();

  const { txs, accounts, findTx, addTx, updateTx, balances } = useData();
  // Read through a ref inside the focus effect so an account edit elsewhere
  // does not re-run hydration and wipe what the user typed.
  const accountsRef = useRef(accounts);
  useEffect(() => { accountsRef.current = accounts; }, [accounts]);
  // The type the edited row had when it was loaded. Switching away from it is
  // what invalidates the stored category.
  const originalTypeRef = useRef<TransactionType | null>(null);
  const usage = useCategoryUsage(txs);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [direction, setDirection] = useState<AdjustmentDirection>('out');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [fromPickerOpen, setFromPickerOpen] = useState(false);
  const [toPickerOpen, setToPickerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

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
            originalTypeRef.current = tx.type;
            setType(tx.type);
            setAmount(String(tx.amount));
            setCategoryId(tx.categoryId);
            setNote(tx.note);
            setAccountId(tx.accountId);
            setToAccountId(tx.toAccountId ?? null);
            setDirection(tx.direction ?? 'out');
            setSelectedDate(new Date(tx.date));
            setHydrated(true);
            return;
          }
        }

        // Opened from a specific day (calendar cell, or history on day view):
        // start on that date instead of today.
        if (dateParam) setSelectedDate(parseIsoDay(dateParam));

        // Quick-add prefill.
        if (params.type && (TYPES as string[]).includes(params.type)) setType(params.type as TransactionType);
        if (params.amount && /^\d+$/.test(params.amount)) setAmount(params.amount);
        if (params.categoryId) setCategoryId(params.categoryId);
        if (params.note) setNote(params.note);

        const accs = accountsRef.current;
        const last = await getLastAccount();
        const preferred = params.accountId ?? prefs.defaultAccountId ?? last;
        const id = preferred && accs.find((a) => a.id === preferred) ? preferred : accs[0]?.id ?? null;
        setAccountId(id);

        if (accs.length > 1) {
          const possibleTo = accs.find((a) => a.id !== id);
          if (possibleTo) setToAccountId(possibleTo.id);
        }

        setHydrated(true);
      })();
      // Prefill params are read once per focus; they never change in place.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, dateParam, refreshCategories, findTx, prefs.defaultAccountId])
  );

  const hasCategories = type === 'income' || type === 'expense';
  const categories = useMemo(
    () => (hasCategories ? sortByUsage(byType(type), usage) : []),
    [byType, type, hasCategories, usage]
  );

  useEffect(() => {
    if (type === 'transfer') {
      setCategoryId('transfer');
      return;
    }
    if (type === 'adjustment') {
      setCategoryId('adjustment');
      return;
    }
    if (categories.length === 0) return;
    if (categories.find((c) => c.id === categoryId)) return;
    // Editing a row whose custom category was deleted: keep the stored id so
    // saving a note edit does not silently re-categorise it. Any type switch
    // (or a fresh entry) picks the first category of the new type.
    if (isEditing && originalTypeRef.current === type) return;
    setCategoryId(categories[0].id);
  }, [categoryId, isEditing, categories, type]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);
  const currentBalance = accountId
    ? balances.get(accountId) ?? selectedAccount?.startingBalance ?? 0
    : 0;

  const accent =
    type === 'income'
      ? colors.income
      : type === 'expense'
        ? colors.expense
        : type === 'transfer'
          ? colors.transfer
          : colors.adjustment;

  function resetForm() {
    setAmount('');
    setNote('');
    setSelectedDate(dateParam ? parseIsoDay(dateParam) : new Date());
  }

  function resolveReturnTarget(): ReturnTarget {
    if (returnTo === 'calendar') return '/calendar';
    if (returnTo === 'history') return '/history';
    if (returnTo === 'report') return '/report';
    return '/dashboard';
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.show('error', t('input.errInvalidAmount')); return; }
    if (!accountId) { toast.show('error', t('input.errNoAccount')); return; }

    if (type === 'transfer') {
      if (!toAccountId) { toast.show('error', t('input.errNoDestination')); return; }
      if (accountId === toAccountId) { toast.show('error', t('input.errSameAccount')); return; }

      // Available balance from the shared cache. When editing, undo the old
      // row's effect on the source account first: a transfer out adds its
      // amount back, an income that becomes a transfer takes its amount away.
      let available = currentBalance;
      if (isEditing && editId) {
        const oldTx = findTx(editId);
        if (oldTx) available -= balanceDelta(oldTx, accountId);
      }
      if (num > available) {
        toast.show('error', t('input.errInsufficientBalance'));
        return;
      }
    }

    setSaving(true);
    const txData = {
      type,
      amount: num,
      categoryId: type === 'transfer' ? 'transfer' : type === 'adjustment' ? 'adjustment' : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? (toAccountId as string) : undefined,
      direction: type === 'adjustment' ? direction : undefined,
      note: note.trim(),
      date: selectedDate.toISOString(),
      dayKey: isoDay(selectedDate),
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

        const successMsg =
          type === 'transfer'
            ? t('input.transferRecorded')
            : type === 'adjustment'
              ? t('input.adjustmentRecorded')
              : type === 'income'
                ? t('input.incomeRecorded')
                : t('input.expenseRecorded');

        toast.show('success', successMsg);
        if (returnTo) router.replace(resolveReturnTarget());
      }
    } catch {
      toast.show('error', t('input.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const styles = useMemo(() => StyleSheet.create({
    flex: { flex: 1 },
    content: {
      padding: spacing.lg,
      paddingBottom: FOOTER_HEIGHT + insets.bottom + spacing.xl,
      gap: spacing.lg,
    },
    heading: { fontSize: fontSize.xxl, fontWeight: weight.heavy, color: colors.textPrimary, letterSpacing: -0.3 },
    subheading: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
    label: {
      fontSize: fontSize.xs,
      fontWeight: weight.heavy,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    dirRow: { flexDirection: 'row', gap: spacing.sm },
    dirBtn: {
      flex: 1,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    dirLabel: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textSecondary },
    noteInput: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 52,
      fontSize: fontSize.input,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hint: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      backgroundColor: colors.adjustmentLight,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    hintText: { flex: 1, fontSize: fontSize.xs, color: colors.adjustment, lineHeight: 17 },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      gap: spacing.sm,
    },
  }), [colors, insets.bottom]);

  if (!hydrated) {
    return (
      <Screen>
        <TopBar />
      </Screen>
    );
  }

  const decreaseActive = direction === 'out';
  const hasTime = selectedDate.getHours() !== 0 || selectedDate.getMinutes() !== 0;
  const dateLabel = hasTime
    ? `${formatDateLong(selectedDate.toISOString())} · ${formatTime(selectedDate.toISOString())}`
    : formatDateLong(selectedDate.toISOString());
  // Web lifts the footer by the keyboard height; native uses KeyboardAvoidingView.
  const footerBottom = Platform.OS === 'web' ? keyboard : 0;

  return (
    <Screen>
      <TopBar showBack={isEditing || !!returnTo} />
      <KeyboardAvoidingView
        style={styles.flex}
        // Android runs edge-to-edge (the window does not resize for the
        // keyboard), so padding behavior is needed on both platforms or the
        // note field ends up hidden behind the keyboard.
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.heading} accessibilityRole="header">
              {isEditing ? t('input.headingEdit') : t('input.headingAdd')}
            </Text>
            <Text style={styles.subheading}>{isEditing ? t('input.subEdit') : t('input.subAdd')}</Text>
          </View>

          <TypeToggle value={type} onChange={setType} />

          <AmountInput
            value={amount}
            onChange={setAmount}
            accent={accent}
            label={t('input.amount')}
            autoFocus={!isEditing && Platform.OS !== 'web' && !params.amount}
          />

          {type === 'adjustment' ? (
            <View>
              <Text style={styles.label}>{t('input.adjustDirection')}</Text>
              <View style={styles.dirRow}>
                <Pressable
                  onPress={() => setDirection('out')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: decreaseActive }}
                  style={[styles.dirBtn, decreaseActive && { borderColor: colors.expense, backgroundColor: colors.expenseLight }]}
                >
                  <Minus size={18} color={decreaseActive ? colors.expense : colors.textSecondary} />
                  <Text style={[styles.dirLabel, decreaseActive && { color: colors.expense }]}>
                    {t('adjust.decrease')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDirection('in')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !decreaseActive }}
                  style={[styles.dirBtn, !decreaseActive && { borderColor: colors.income, backgroundColor: colors.incomeLight }]}
                >
                  <Plus size={18} color={!decreaseActive ? colors.income : colors.textSecondary} />
                  <Text style={[styles.dirLabel, !decreaseActive && { color: colors.income }]}>
                    {t('adjust.increase')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {hasCategories ? (
            <View>
              <Text style={styles.label}>{t('input.category')}</Text>
              <CategoryGrid categories={categories} value={categoryId} onChange={setCategoryId} accent={accent} />
            </View>
          ) : null}

          <SectionGroup title={type === 'transfer' ? t('input.accounts') : t('input.account')}>
            <ListRow
              Icon={selectedAccount ? findAccountType(selectedAccount.typeId).icon : Wallet}
              title={selectedAccount ? selectedAccount.name : t('input.selectAccount')}
              subtitle={
                selectedAccount
                  ? `${tBuiltin(t, 'accountTypes', findAccountType(selectedAccount.typeId).id)} · ${formatIDR(currentBalance)}`
                  : undefined
              }
              value={type === 'transfer' ? t('input.from') : undefined}
              trailing="chevron"
              onPress={() => setFromPickerOpen(true)}
            />
            {type === 'transfer' ? (
              <ListRow
                Icon={selectedToAccount ? findAccountType(selectedToAccount.typeId).icon : ArrowRight}
                title={selectedToAccount ? selectedToAccount.name : t('input.selectAccount')}
                subtitle={
                  selectedToAccount
                    ? `${tBuiltin(t, 'accountTypes', findAccountType(selectedToAccount.typeId).id)} · ${formatIDR(balances.get(selectedToAccount.id) ?? selectedToAccount.startingBalance)}`
                    : undefined
                }
                value={t('input.to')}
                trailing="chevron"
                onPress={() => setToPickerOpen(true)}
              />
            ) : null}
          </SectionGroup>

          {type === 'adjustment' ? (
            <View style={styles.hint}>
              <Info size={16} color={colors.adjustment} />
              <Text style={styles.hintText}>{t('adjust.excludedHint')}</Text>
            </View>
          ) : null}

          <SectionGroup title={t('input.date')}>
            <ListRow
              Icon={CalendarDays}
              title={dateLabel}
              trailing="chevron"
              onPress={() => setDateOpen(true)}
              accessibilityLabel={`${t('input.date')}: ${dateLabel}`}
            />
          </SectionGroup>

          <View>
            <Text style={styles.label}>{t('input.note')}</Text>
            <TextInput
              style={styles.noteInput}
              placeholder={t('input.notePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={80}
              accessibilityLabel={t('input.note')}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, bottom: footerBottom }]}>
          {isEditing ? (
            <Button
              label={t('common.cancel')}
              onPress={() => setConfirmCancel(true)}
              variant="secondary"
              size="lg"
            />
          ) : null}
          <Button
            label={saving ? t('input.saving') : isEditing ? t('input.update') : t('input.saveTransaction')}
            onPress={handleSave}
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>

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

      <DateSheet
        visible={dateOpen}
        value={selectedDate}
        onChange={setSelectedDate}
        onClose={() => setDateOpen(false)}
      />

      <ConfirmModal
        visible={confirmCancel}
        title={t('input.discardTitle')}
        message={t('input.discardMsg')}
        confirmLabel={t('input.discard')}
        cancelLabel={t('input.keepEditing')}
        tone="danger"
        onConfirm={() => {
          setConfirmCancel(false);
          router.replace(resolveReturnTarget());
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </Screen>
  );
}
