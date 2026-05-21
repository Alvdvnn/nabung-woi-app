import { useEffect, useMemo, useState } from 'react';
import {
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
import ConfirmModal from './ConfirmModal';
import { useT } from '../i18n';

interface Props {
  onChange: () => void;
}

type View_ = 'idle' | 'create' | 'change' | 'remove';

export default function PinManager({ onChange }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const t = useT();
  const fmtErr = (e: 'digitsOnly' | 'length') =>
    e === 'digitsOnly' ? t('pin.errDigitsOnly') : t('pin.errLen', { min: PIN_MIN, max: PIN_MAX });
  const [enabled, setEnabled] = useState(false);
  const [view, setView] = useState<View_>('idle');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

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
    if (fmt) { toast.show('error', fmtErr(fmt)); return; }
    if (newPin !== confirmPin) { toast.show('error', t('pin.errMismatch')); return; }
    if (!question.trim()) { toast.show('error', t('pin.errRecoveryQ')); return; }
    if (!answer.trim()) { toast.show('error', t('pin.errAnswer')); return; }

    setBusy(true);
    await setPin({ pin: newPin, question, answer });
    setBusy(false);
    toast.show('success', t('pin.enabledMsg'));
    resetForm();
    refreshState();
  }

  async function submitChange() {
    const fmt = validatePinFormat(newPin);
    if (fmt) { toast.show('error', fmtErr(fmt)); return; }
    if (newPin !== confirmPin) { toast.show('error', t('pin.errMismatch')); return; }
    if (!question.trim() || !answer.trim()) { toast.show('error', t('pin.errBoth')); return; }

    setBusy(true);
    const ok = await verifyPin(currentPin);
    if (!ok) {
      setBusy(false);
      toast.show('error', t('pin.errCurrent'));
      return;
    }
    await setPin({ pin: newPin, question, answer });
    setBusy(false);
    toast.show('success', t('pin.updatedMsg'));
    resetForm();
    refreshState();
  }

  async function submitRemove() {
    if (!currentPin) { toast.show('error', t('pin.errEnterCurrent')); return; }
    setBusy(true);
    const ok = await verifyPin(currentPin);
    setBusy(false);
    if (!ok) {
      toast.show('error', t('pin.errCurrent'));
      return;
    }
    setConfirmRemove(true);
  }

  async function doRemove() {
    setBusy(true);
    await clearPin();
    setBusy(false);
    setConfirmRemove(false);
    toast.show('success', t('pin.removedMsg'));
    resetForm();
    refreshState();
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
          <Text style={styles.statusText}>{enabled ? t('pin.enabled') : t('pin.disabled')}</Text>
          <Text style={styles.statusMeta}>
            {enabled
              ? t('pin.enabledMeta')
              : t('pin.disabledMeta', { min: PIN_MIN, max: PIN_MAX })}
          </Text>
        </View>
      </View>

      {view === 'idle' && (
        <View style={styles.actions}>
          {!enabled ? (
            <Pressable style={styles.actionBtn} onPress={() => setView('create')}>
              <Text style={styles.actionText}>{t('pin.setup')}</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.actionBtn} onPress={() => setView('change')}>
                <Text style={styles.actionText}>{t('pin.change')}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.dangerBtn]}
                onPress={() => setView('remove')}
              >
                <Text style={[styles.actionText, styles.dangerText]}>{t('pin.removeBtn')}</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {view === 'create' && (
        <View style={styles.form}>
          <Text style={styles.label}>{t('pin.newPin')}</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={newPin}
            onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            placeholder={t('pin.digitsHint', { min: PIN_MIN, max: PIN_MAX })}
            placeholderTextColor={colors.textMuted}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>{t('pin.confirmPin')}</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            placeholder={t('pin.confirmShort')}
            placeholderTextColor={colors.textMuted}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>{t('pin.recoveryQ')}</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder={t('pin.recoveryQPh')}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>{t('pin.answer')}</Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder={t('pin.answerPh')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <Text style={styles.helper}>
            {t('pin.recoveryHelper')}
          </Text>
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={resetForm}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formBtn, styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={submitCreate}
              disabled={busy}
            >
              <Text style={styles.submitText}>{t('pin.enable')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {view === 'change' && (
        <View style={styles.form}>
          <Text style={styles.label}>{t('pin.currentPin')}</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={currentPin}
            onChangeText={(v) => setCurrentPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>{t('pin.newPin')}</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={newPin}
            onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            placeholder={t('pin.digitsHint', { min: PIN_MIN, max: PIN_MAX })}
            placeholderTextColor={colors.textMuted}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>{t('pin.confirmNewPin')}</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            keyboardType="number-pad"
            secureTextEntry
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX))}
            maxLength={PIN_MAX}
          />
          <Text style={styles.label}>{t('pin.recoveryQ')}</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder={t('pin.updateRecoveryPh')}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>{t('pin.answer')}</Text>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder={t('pin.answerRecoveryPh')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <View style={styles.formActions}>
            <Pressable style={[styles.formBtn, styles.cancelBtn]} onPress={resetForm}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formBtn, styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={submitChange}
              disabled={busy}
            >
              <Text style={styles.submitText}>{t('pin.updatePin')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ConfirmModal
        visible={confirmRemove}
        title={t('pin.removeTitle')}
        message={t('pin.removeMsg')}
        confirmLabel={t('pin.remove')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={busy}
        onConfirm={doRemove}
        onCancel={() => setConfirmRemove(false)}
      />

      {view === 'remove' && (
        <View style={styles.form}>
          <Text style={styles.label}>{t('pin.currentPin')}</Text>
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
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formBtn, styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={submitRemove}
              disabled={busy}
            >
              <Text style={styles.submitText}>{t('pin.remove')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
