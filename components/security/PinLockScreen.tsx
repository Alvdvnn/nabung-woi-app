import { useCallback, useMemo, useState } from 'react';
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
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldQuestion } from 'lucide-react-native';
import Logo from '../brand/Logo';
import Keypad from './Keypad';
import PinDots from './PinDots';
import Button from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, motion, radius, spacing, weight } from '../../constants/theme';
import {
  clearPin,
  getRecoveryQuestion,
  PIN_MAX,
  PIN_MIN,
  verifyAnswer,
  verifyPin,
} from '../../utils/pin';
import { clearAll } from '../../utils/storage';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import { useT } from '../../i18n';

interface Props {
  onUnlock: () => void;
  onRecovered: () => void;
}

type Mode = 'pin' | 'recover';

function greetingKey(hour: number): 'greetMorning' | 'greetAfternoon' | 'greetEvening' | 'greetNight' {
  if (hour >= 4 && hour < 11) return 'greetMorning';
  if (hour >= 11 && hour < 15) return 'greetAfternoon';
  if (hour >= 15 && hour < 19) return 'greetEvening';
  return 'greetNight';
}

/**
 * Lock screen: branded header, animated dots, big keypad. No TextInput on the
 * PIN path, so iOS never zooms and the keypad is identical on every platform.
 */
export default function PinLockScreen({ onUnlock, onRecovered }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { resetCache } = useData();
  const { refresh: refreshCategories } = useCategories();

  const [mode, setMode] = useState<Mode>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  const exit = useSharedValue(1);
  const exitStyle = useAnimatedStyle(() => ({
    opacity: exit.value,
    transform: [{ scale: 0.96 + exit.value * 0.04 }],
  }));

  const greeting = t(`pinLock.${greetingKey(new Date().getHours())}`);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        content: {
          flexGrow: 1,
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xl,
          justifyContent: 'space-between',
          gap: spacing.xl,
        },
        header: { alignItems: 'center', gap: spacing.md },
        greeting: { fontSize: fontSize.xxl, fontWeight: weight.heavy, color: colors.textPrimary, textAlign: 'center' },
        sub: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
        error: { color: colors.expense, textAlign: 'center', fontSize: fontSize.sm, fontWeight: weight.semibold, minHeight: 18 },
        link: { alignSelf: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 44, justifyContent: 'center' },
        linkText: { color: colors.primary, fontWeight: weight.semibold, fontSize: fontSize.sm },
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.md,
        },
        iconWrap: {
          alignSelf: 'center',
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: { fontSize: fontSize.xl, fontWeight: weight.heavy, color: colors.textPrimary, textAlign: 'center' },
        label: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: weight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
        questionText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: weight.semibold },
        input: {
          backgroundColor: colors.bg,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: fontSize.input,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        warn: { backgroundColor: colors.expenseLight, padding: spacing.md, borderRadius: radius.md, gap: 6 },
        warnTitle: { color: colors.expense, fontWeight: weight.bold, fontSize: fontSize.sm },
        warnBody: { color: colors.expense, fontSize: fontSize.xs, lineHeight: 17 },
      }),
    [colors, insets.top, insets.bottom],
  );

  const finishUnlock = useCallback(() => {
    exit.value = withTiming(0, { duration: motion.base }, (done) => {
      if (done) runOnJS(onUnlock)();
    });
  }, [exit, onUnlock]);

  const submitPin = useCallback(
    async (candidate: string) => {
      if (candidate.length < PIN_MIN || busy) return;
      setBusy(true);
      const ok = await verifyPin(candidate);
      setBusy(false);
      if (!ok) {
        hapticError();
        setError(t('pinLock.errWrong'));
        setShakeKey((k) => k + 1);
        setTimeout(() => setPin(''), 260);
        return;
      }
      hapticSuccess();
      finishUnlock();
    },
    [busy, finishUnlock, t],
  );

  const onDigit = useCallback(
    (d: string) => {
      if (busy) return;
      setError('');
      setPin((p) => {
        if (p.length >= PIN_MAX) return p;
        const next = p + d;
        // Longest allowed PIN typed: nothing more can come, verify now.
        if (next.length === PIN_MAX) setTimeout(() => submitPin(next), 0);
        return next;
      });
    },
    [busy, submitPin],
  );

  async function startRecover() {
    const q = await getRecoveryQuestion();
    setQuestion(q);
    setMode('recover');
    setError('');
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      setError(t('pinLock.errEnterAns'));
      return;
    }
    setBusy(true);
    const ok = await verifyAnswer(answer);
    setBusy(false);
    if (!ok) {
      hapticError();
      setError(t('pinLock.errAnsWrong'));
      return;
    }
    setConfirmWipe(true);
  }

  async function doWipe() {
    setBusy(true);
    await clearPin();
    await clearAll();
    // The in-memory cache was hydrated before the lock screen; drop it so the
    // wiped data does not linger on screen until the next launch.
    resetCache();
    await refreshCategories();
    setBusy(false);
    onRecovered();
  }

  function backToPin() {
    setMode('pin');
    setConfirmWipe(false);
    setAnswer('');
    setError('');
  }

  return (
    <Animated.View style={[styles.root, exitStyle]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
          {mode === 'pin' ? (
            <>
              <View style={styles.header}>
                <Logo size={88} />
                <Text style={styles.greeting} accessibilityRole="header">
                  {greeting}
                </Text>
                <Text style={styles.sub}>{t('pinLock.enterSub')}</Text>
              </View>

              <View style={{ gap: spacing.md }}>
                <PinDots length={pin.length} minSlots={PIN_MIN} shakeKey={shakeKey} error={!!error} />
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              </View>

              <View style={{ gap: spacing.sm }}>
                <Keypad
                  onDigit={onDigit}
                  onBackspace={() => {
                    setError('');
                    setPin((p) => p.slice(0, -1));
                  }}
                  onSubmit={() => submitPin(pin)}
                  submitEnabled={pin.length >= PIN_MIN}
                  disabled={busy}
                />
                <Pressable style={styles.link} onPress={startRecover} accessibilityRole="button">
                  <Text style={styles.linkText}>{t('pinLock.forgot')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <ShieldQuestion size={30} color={colors.primary} />
                </View>
                <Text style={styles.title} accessibilityRole="header">
                  {confirmWipe ? t('pinLock.resetTitle') : t('pinLock.secQ')}
                </Text>
              </View>

              <View style={styles.card}>
                {!confirmWipe ? (
                  <>
                    <Text style={styles.label}>{t('pinLock.question')}</Text>
                    <Text style={styles.questionText}>{question ?? t('pinLock.noQ')}</Text>
                    <TextInput
                      style={styles.input}
                      value={answer}
                      onChangeText={(v) => {
                        setAnswer(v);
                        setError('');
                      }}
                      placeholder={t('pinLock.yourAnswer')}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      accessibilityLabel={t('pinLock.yourAnswer')}
                    />
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <Button label={t('pinLock.verify')} onPress={submitAnswer} loading={busy} disabled={!question} size="lg" />
                  </>
                ) : (
                  <>
                    <View style={styles.warn}>
                      <Text style={styles.warnTitle}>{t('pinLock.eraseWarn')}</Text>
                      <Text style={styles.warnBody}>{t('pinLock.eraseBody')}</Text>
                    </View>
                    <Button label={t('pinLock.erase')} onPress={doWipe} loading={busy} variant="danger" size="lg" />
                  </>
                )}
              </View>

              <Pressable style={styles.link} onPress={backToPin} accessibilityRole="button">
                <Text style={styles.linkText}>{confirmWipe ? t('common.cancel') : t('pinLock.back')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
