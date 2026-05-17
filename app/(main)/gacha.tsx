import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Dices, Check, X, Plus } from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import { radius, spacing, fontSize, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type Result = 'buy' | 'skip' | null;

export default function GachaScreen() {
  const router = useRouter();
  const [result, setResult] = useState<Result>(null);
  const [spinning, setSpinning] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    heading: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary },
    sub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', maxWidth: 260 },
    stage: { height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
    coin: {
      width: 160, height: 160, borderRadius: 80,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      ...shadow.card,
      shadowOpacity: 0.2,
    },
    coinBuy: { backgroundColor: colors.income },
    coinSkip: { backgroundColor: colors.expense },
    resultText: { fontSize: fontSize.display, fontWeight: '900', letterSpacing: 1 },
    buyText: { color: colors.income },
    skipText: { color: colors.expense },
    resultSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', maxWidth: 240 },
    spinBtn: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.full,
      minWidth: 200,
      alignItems: 'center',
    },
    spinBtnDisabled: { opacity: 0.6 },
    spinText: { fontSize: fontSize.md, fontWeight: '700', color: colors.white },
  }), [colors]);

  function spin() {
    setResult(null);
    setSpinning(true);
    rotate.setValue(0);
    Animated.timing(rotate, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setResult(Math.random() < 0.5 ? 'buy' : 'skip');
      setSpinning(false);
    });
  }

  const spinDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1440deg'] });

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Gacha" showLogo={false} showActions={false} />
      <View style={styles.content}>
        <Text style={styles.heading}>Let fate decide</Text>
        <Text style={styles.sub}>50/50 chance — should you buy it or skip it?</Text>

        <View style={styles.stage}>
          {result === null ? (
            <Animated.View style={[styles.coin, { transform: [{ rotate: spinDeg }] }]}>
              <Dices size={64} color={colors.white} />
            </Animated.View>
          ) : result === 'buy' ? (
            <View style={[styles.coin, styles.coinBuy]}>
              <Check size={64} color={colors.white} />
            </View>
          ) : (
            <View style={[styles.coin, styles.coinSkip]}>
              <X size={64} color={colors.white} />
            </View>
          )}
        </View>

        {result && (
          <Text style={[styles.resultText, result === 'buy' ? styles.buyText : styles.skipText]}>
            {result === 'buy' ? 'BUY IT!' : 'SKIP IT'}
          </Text>
        )}
        {result && (
          <Text style={styles.resultSub}>
            {result === 'buy' ? 'The dice favor you. Go for it.' : 'Save your money. Walk away.'}
          </Text>
        )}

        <Pressable
          style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
          onPress={spin}
          disabled={spinning}
        >
          <Text style={styles.spinText}>
            {spinning ? 'Rolling…' : result ? 'Spin Again' : 'Spin'}
          </Text>
        </Pressable>
      </View>
      <Fab Icon={Plus} bottom={80} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}
