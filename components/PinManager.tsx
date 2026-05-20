import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ShieldCheck, ShieldOff } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { fontSize, radius, spacing } from '../constants/theme';
import {
  clearPin,
  hasPin,
  PIN_MAX,
  PIN_MIN,
  setPin,
  validatePinFormat,
  verifyPin,
} from '../utils/pin';
import { useToast } from '../hooks/useToast';

interface Props {
  onChange: () => void;
}

type View_ = 'idle' | 'create' | 'change' | 'remove';

export default function PinManager({ onChange }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [view, setView] = useState<View_>('idle');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        statusRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.card,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        statusText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, flex: 1 },
        statusMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
        actionBtn: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        actionText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
        dangerBtn: { borderColor: colors.expense },
        dangerText: { color: colors.expense },
        form: {
          gap: spacing.sm,
          backgroundColor: colors.card,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: spacing.sm,
        },
        label: {
          fontSize: fontSize.xs,
          color: colors.textSecondary,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        input: {
          backgroundColor: colors.bg,
          borderRadius: radius.sm,
          padding: spacing.md,
          fontSize: fontSize.md,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        pinInput: { letterSpacing: 4, textAlign: 'center' },
        formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
        formBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, alignItems: 'center' },
        cancelBtn: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
        submitBtn: { backgroundColor: colors.primary },
        cancelText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
        submitText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
        helper: { fontSize: fontSize.xs, color: colors.textMuted },
      }),
    [colors],
  );

  useEffect(() => {
    hasPin().then(setEnabled);
  }, []);

  function resetForm() {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setQuestion('');
    setAnswer('');
    setView('idle');
  }

  async function refreshState() {
    const on = await hasPin();
    setEnabled(on);
    onChange();
  }

  async function submitCreate() {
    const fmt = validatePinFormat(newPin);
    if (fmt) { toast.show('error', fmt); return; }
    if (newPin !== confirmPin) { toast.show('error', 'PINs do not match'); return; }
    if (!question.trim()) { toast.show('error', 'Enter a recovery question'); return; }
    if (!answer.trim()) { toast.show('error', 'Enter the answer'); return; }

    setBusy(true);
    await setPin({ pin: newPin, question, answer });
    setBusy(false);
    toast.show('success', 'PIN enabled');
    resetForm();
    refreshState();
  }

  async function submitChange() {
    const fmt = validatePinFormat(newPin);
    if (fmt) { toast.show('error', fmt); return; }
    if (newPin !== confirmPin) { toast.show('error', 'PINs do not match'); return; }
    if (!question.trim() || !answer.trim()) { toast.show('error', 'Recovery question and answer required'); return; }

    setBusy(true);
    const ok = await verifyPin(currentPin);
    if (!ok) {
      setBusy(false);
      toast.show('error', 'Current PIN incorrect');
      return;
    }
    await setPin({ pin: newPin, question, answer });
    setBusy(false);
    toast.show('success', 'PIN updated');
    resetForm();
    refreshState();
  }

  async function submitRemove() {
    if (!currentPin) { toast.show('error', 'Enter current PIN'); return; }
    setBusy(true);
    const ok = await verifyPin(currentPin);
    if (!ok) {
      setBusy(false);
      toast.show('error', 'Current PIN incorrect');
      return;
    }
    Alert.alert(
      'Remove PIN?',
      'The app will no longer require a PIN on launch.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setBusy(false),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await clearPin();
            setBusy(false);
            toast.show('success', 'PIN removed');
            resetForm();
            refreshState();
          },
        },
      ],
    );
  }

  return (
    <View>
      <View style={styles.statusRow}>
        {enabled ? (
          <ShieldCheck size={20} color={colors.primary} />
        ) : (
          <ShieldOff size={20} color={colors.textMuted} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.statusText}>{enabled ? 'PIN is enabled' : 'PIN is disabled'}</Text>
          <Text style={styles.statusMeta}>
            {enabled
              ? 'App locks on launch and after 1 minute in background.'
              : `Set a ${PIN_MIN}-${PIN_MAX} digit PIN to require unlock.`}
          </Text>
        </View>
      </View>

      {view === 'idle' && (
        <View style={styles.actions}>
          {!enabled ? (
            <Pressable style={styles.actionBtn} onPress={() => setView('create')}>
              <Text style={styles.actionText}>Set up PIN</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.actionBtn} onPress={() => setView('change')}>
                <Text style={styles.actionText}>Change PIN</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.dangerBtn]}
                onPress={() => setView('remove')}
              >
                <Text style={[styles.actionText, styles.dangerText]}>Remove PIN</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {view === 'create' && (
        <View style={styles.form}>
          <Text style={styles.label}>New PIN</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={newPin}
            onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            placeholder={`${PIN_MIN}-${PIN_MAX} digits`}
            placeholderTextColor={colors.textMuted}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>Confirm PIN</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            placeholder="Confirm"
            placeholderTextColor={colors.textMuted}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>Recovery question</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="e.g. Your first pet's name"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Answer</Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Used to reset PIN"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <Text style={styles.helper}>
            If you forget your PIN, you must answer this question. Reset will erase all data.
          </Text>
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.formBtn, styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={submitCreate}
              disabled={busy}
            >
              <Text style={styles.submitText}>Enable PIN</Text>
            </Pressable>
          </View>
        </View>
      )}

      {view === 'change' && (
        <View style={styles.form}>
          <Text style={styles.label}>Current PIN</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={currentPin}
            onChangeText={(v) => setCurrentPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>New PIN</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={newPin}
            onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            placeholder={`${PIN_MIN}-${PIN_MAX} digits`}
            placeholderTextColor={colors.textMuted}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>Confirm new PIN</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>Recovery question</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Update recovery prompt"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Answer</Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Answer to recovery question"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.formBtn, styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={submitChange}
              disabled={busy}
            >
              <Text style={styles.submitText}>Update PIN</Text>
            </Pressable>
          </View>
        </View>
      )}

      {view === 'remove' && (
        <View style={styles.form}>
          <Text style={styles.label}>Current PIN</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={currentPin}
            onChangeText={(v) => setCurrentPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            maxLength={PIN_MAX}
          />
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.formBtn, styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={submitRemove}
              disabled={busy}
            >
              <Text style={styles.submitText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
