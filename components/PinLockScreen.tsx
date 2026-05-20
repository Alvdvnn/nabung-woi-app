import { useMemo, useState } from 'react';
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
import { Lock, ShieldQuestion } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { fontSize, radius, spacing } from '../constants/theme';
import {
  clearPin,
  getRecoveryQuestion,
  PIN_MAX,
  PIN_MIN,
  verifyAnswer,
  verifyPin,
} from '../utils/pin';
import { clearAll } from '../utils/storage';

interface Props {
  onUnlock: () => void;
  onRecovered: () => void;
}

type Mode = 'pin' | 'recover';

export default function PinLockScreen({ onUnlock, onRecovered }: Props) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        content: {
          flexGrow: 1,
          padding: spacing.lg,
          gap: spacing.lg,
          justifyContent: 'center',
          paddingBottom: spacing.xxl * 3,
        },
        iconWrap: {
          alignSelf: 'center',
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        title: {
          fontSize: fontSize.xxl,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
        },
        sub: {
          fontSize: fontSize.sm,
          color: colors.textMuted,
          textAlign: 'center',
          maxWidth: 280,
          alignSelf: 'center',
        },
        input: {
          backgroundColor: colors.card,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: fontSize.lg,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
          textAlign: 'center',
          letterSpacing: 6,
        },
        textInput: {
          backgroundColor: colors.card,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: fontSize.md,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        error: { color: colors.expense, textAlign: 'center', fontSize: fontSize.sm },
        primaryBtn: {
          backgroundColor: colors.primary,
          paddingVertical: spacing.md + 2,
          borderRadius: radius.full,
          alignItems: 'center',
        },
        primaryText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
        linkBtn: { alignItems: 'center', paddingVertical: spacing.md },
        linkText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
        warn: {
          backgroundColor: colors.expenseLight,
          padding: spacing.md,
          borderRadius: radius.md,
          gap: 6,
        },
        warnTitle: { color: colors.expense, fontWeight: '700', fontSize: fontSize.sm },
        warnBody: { color: colors.expense, fontSize: fontSize.xs },
        danger: { backgroundColor: colors.expense },
        questionLabel: {
          fontSize: fontSize.xs,
          color: colors.textSecondary,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        questionText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: '600' },
      }),
    [colors],
  );

  async function submitPin() {
    if (pin.length < PIN_MIN) {
      setError(`Enter at least ${PIN_MIN} digits`);
      return;
    }
    setBusy(true);
    const ok = await verifyPin(pin);
    setBusy(false);
    if (!ok) {
      setError('Incorrect PIN');
      setPin('');
      return;
    }
    onUnlock();
  }

  async function startRecover() {
    const q = await getRecoveryQuestion();
    setQuestion(q);
    setMode('recover');
    setError('');
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      setError('Enter your answer');
      return;
    }
    setBusy(true);
    const ok = await verifyAnswer(answer);
    setBusy(false);
    if (!ok) {
      setError('Answer did not match');
      return;
    }
    setConfirmWipe(true);
  }

  async function doWipe() {
    setBusy(true);
    await clearPin();
    await clearAll();
    setBusy(false);
    onRecovered();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            {mode === 'pin' ? (
              <Lock size={32} color={colors.primary} />
            ) : (
              <ShieldQuestion size={32} color={colors.primary} />
            )}
          </View>

          {mode === 'pin' ? (
            <>
              <Text style={styles.title}>Enter PIN</Text>
              <Text style={styles.sub}>Unlock Nabung Woi to view your finances.</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={(v) => {
                  setPin(v.replace(/[^0-9]/g, '').slice(0, PIN_MAX));
                  setError('');
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={PIN_MAX}
                placeholder="••••"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
                onPress={submitPin}
                disabled={busy}
              >
                <Text style={styles.primaryText}>Unlock</Text>
              </Pressable>
              <Pressable style={styles.linkBtn} onPress={startRecover}>
                <Text style={styles.linkText}>Forgot PIN?</Text>
              </Pressable>
            </>
          ) : !confirmWipe ? (
            <>
              <Text style={styles.title}>Security Question</Text>
              <Text style={styles.questionLabel}>Question</Text>
              <Text style={styles.questionText}>{question ?? 'No recovery question set.'}</Text>
              <TextInput
                style={styles.textInput}
                value={answer}
                onChangeText={(v) => {
                  setAnswer(v);
                  setError('');
                }}
                placeholder="Your answer"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
                onPress={submitAnswer}
                disabled={busy || !question}
              >
                <Text style={styles.primaryText}>Verify</Text>
              </Pressable>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  setMode('pin');
                  setError('');
                  setAnswer('');
                }}
              >
                <Text style={styles.linkText}>Back to PIN</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Reset Required</Text>
              <View style={styles.warn}>
                <Text style={styles.warnTitle}>This will erase all data</Text>
                <Text style={styles.warnBody}>
                  Answer verified. To remove the PIN, all transactions, accounts, and categories
                  must be cleared. This cannot be undone.
                </Text>
              </View>
              <Pressable
                style={[styles.primaryBtn, styles.danger, busy && { opacity: 0.6 }]}
                onPress={doWipe}
                disabled={busy}
              >
                <Text style={styles.primaryText}>Erase all and reset</Text>
              </Pressable>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  setConfirmWipe(false);
                  setMode('pin');
                  setAnswer('');
                  setError('');
                }}
              >
                <Text style={styles.linkText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
