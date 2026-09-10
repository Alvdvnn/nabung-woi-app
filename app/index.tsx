import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Info, Minus, Plus } from 'lucide-react-native';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import Fab from '../components/ui/Fab';
import Button from '../components/ui/Button';
import TypeToggle from '../components/transaction/TypeToggle';
import AmountInput from '../components/transaction/AmountInput';
import CategoryChip from '../components/transaction/CategoryChip';
import DatePickerField from '../components/transaction/DatePickerField';
import AccountPickerSheet from '../components/account/AccountPickerSheet';
import ConfirmModal from '../components/feedback/ConfirmModal';
import { fabBottomForFullScreen } from '../constants/layout';
import { fontSize, radius, spacing, weight } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useCategories } from '../context/CategoriesContext';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { AdjustmentDirection, TransactionType, getLastAccount, setLastAccount } from '../utils/storage';
import { isoDay, parseIsoDay } from '../utils/date';
import { formatIDR } from '../utils/format';
import { genId } from '../utils/id';

type ReturnTarget = '/calendar' | '/history' | '/dashboard' | '/report';

export default function InputScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ id?: string; returnTo?: string; date?: string }>();
  const { id: editId, returnTo, date: dateParam } = params;
  const isEditing = !!editId;
  const { byType, refresh: refreshCategories } = useCategories();

  const { accounts, findTx, addTx, updateTx, balances } = useData();

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
            setDirection(tx.direction ?? 'out');
            setSelectedDate(new Date(tx.date));
            setHydrated(true);
            return;
          }
        }

        // Opened from a specific day (calendar cell, or history on day view):
        // start on that date instead of today.
        if (dateParam) setSelectedDate(parseIsoDay(dateParam));

        const last = await getLastAccount();
        const id = last && accounts.find((a) => a.id === last) ? last : accounts[0]?.id ?? null;
        setAccountId(id);

        if (accounts.length > 1) {
          const possibleTo = accounts.find((a) => a.id !== id);
          if (possibleTo) setToAccountId(possibleTo.id);
        }

        setHydrated(true);
      })();
    }, [editId, dateParam, refreshCategories, findTx, accounts])
  );

  const hasCategories = type === 'income' || type === 'expense';
  const categories = useMemo(
    () => (hasCategories ? byType(type) : []),
    [byType, type, hasCategories]
  );

  useEffect(() => {
    if (isEditing) return;
    if (type === 'transfer') {
      setCategoryId('transfer');
      return;
    }
    if (type === 'adjustment') {
      setCategoryId('adjustment');
      return;
    }
    if (categories.length === 0) return;
    if (!categories.find((c) => c.id === categoryId)) setCategoryId(categories[0].id);
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

      // Available balance from the shared cache. When editing this transfer,
      // add the old amount back so the source still counts as having it.
      let available = currentBalance;
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
      }
    } catch {
      toast.show('error', t('input.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const styles = useMemo(() => StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: 160, gap: spacing.md },
    heading: { fontSize: fontSize.xxl, fontWeight: weight.heavy, color: colors.textPrimary },
    subheading: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
    label: {
      fontSize: fontSize.xs,
      fontWeight: weight.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    cats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    accountPill: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: weight.medium },
    accountMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
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
      padding: spacing.md,
      minHeight: 52,
      fontSize: fontSize.md,
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
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  }), [colors]);

  if (!hydrated) {
    return (
      <Screen>
        <TopBar />
      </Screen>
    );
  }

  const decreaseActive = direction === 'out';

  return (
    <Screen>
      <TopBar />
      <KeyboardAvoidingView
        style={styles.flex}
        // Android runs edge-to-edge (the window does not resize for the
        // keyboard), so padding behavior is needed on both platforms or the
        // note field ends up hidden behind the keyboard.
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
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

          <View>
            <Text style={styles.label}>{t('input.amount')}</Text>
            <AmountInput
              value={amount}
              onChange={setAmount}
              accent={accent}
              label={t('input.amount')}
              autoFocus={!isEditing && Platform.OS !== 'web'}
            />
          </View>

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
            </View>
          ) : null}

          <View>
            <Text style={styles.label}>
              {type === 'transfer' ? t('input.fromAccount') : t('input.account')}
            </Text>
            <Pressable
              style={styles.accountPill}
              onPress={() => setFromPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={selectedAccount ? selectedAccount.name : t('input.selectAccount')}
            >
              <View>
                <Text style={styles.accountText}>
                  {selectedAccount ? selectedAccount.name : t('input.selectAccount')}
                </Text>
                {selectedAccount ? (
                  <Text style={styles.accountMeta}>
                    {`${t('adjust.currentBalance')}: ${formatIDR(currentBalance)}`}
                  </Text>
                ) : null}
              </View>
              <ChevronDown size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {type === 'transfer' ? (
            <View>
              <Text style={styles.label}>{t('input.toAccount')}</Text>
              <Pressable
                style={styles.accountPill}
                onPress={() => setToPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={selectedToAccount ? selectedToAccount.name : t('input.selectAccount')}
              >
                <Text style={styles.accountText}>
                  {selectedToAccount ? selectedToAccount.name : t('input.selectAccount')}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}

          {type === 'adjustment' ? (
            <View style={styles.hint}>
              <Info size={16} color={colors.adjustment} />
              <Text style={styles.hintText}>{t('adjust.excludedHint')}</Text>
            </View>
          ) : null}

          <View>
            <Text style={styles.label}>{t('input.date')}</Text>
            <DatePickerField value={selectedDate} onChange={setSelectedDate} />
          </View>

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
              onFocus={() => {
                // Wait for the keyboard to actually show before scrolling,
                // instead of guessing with a timer.
                const sub = Keyboard.addListener('keyboardDidShow', () => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                  sub.remove();
                });
              }}
            />
          </View>

          <View style={styles.actions}>
            {isEditing ? (
              <Button
                label={t('common.cancel')}
                onPress={() => setConfirmCancel(true)}
                variant="secondary"
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
        </ScrollView>
      </KeyboardAvoidingView>

      {!isEditing && (
        <Fab bottom={fabBottomForFullScreen(insets.bottom)} onPress={() => router.push('/dashboard')} />
      )}

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
        onConfirm={() => {
          setConfirmCancel(false);
          router.replace(resolveReturnTarget());
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </Screen>
  );
}
