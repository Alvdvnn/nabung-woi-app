import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fabBottomForTabScreen } from '../../constants/layout';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Coins,
  Gem,
  DollarSign,
  CircleX,
  Sparkles,
  Crown,
} from 'lucide-react-native';
import TopBar from '../../components/TopBar';
import Fab from '../../components/Fab';
import { radius, spacing, fontSize, shadow } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type Result = 'buy' | 'skip' | null;

const REEL_HEIGHT = 92;
const REEL_WIDTH = 76;

interface Symbol {
  Icon: any;
  key: string;
  win: boolean;
}

const SYMBOLS: Symbol[] = [
  { key: 'coin', Icon: Coins, win: true },
  { key: 'gem', Icon: Gem, win: true },
  { key: 'dollar', Icon: DollarSign, win: true },
  { key: 'crown', Icon: Crown, win: true },
  { key: 'sparkle', Icon: Sparkles, win: true },
  { key: 'x', Icon: CircleX, win: false },
];

// Build a long strip; result symbol placed at a known index.
function buildStrip(targetIdx: number, cycles: number) {
  const strip: Symbol[] = [];
  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < SYMBOLS.length; i++) strip.push(SYMBOLS[i]);
  }
  strip.push(SYMBOLS[targetIdx]);
  return strip;
}

export default function GachaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const [result, setResult] = useState<Result>(null);
  const [spinning, setSpinning] = useState(false);
  const [strips, setStrips] = useState<Symbol[][]>(() => [
    buildStrip(0, 1),
    buildStrip(0, 1),
    buildStrip(0, 1),
  ]);

  const reelAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const flash = useRef(new Animated.Value(0)).current;
  const leverY = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },

    title: {
      fontSize: fontSize.xxl,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    sub: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
      marginTop: -spacing.sm,
    },

    cabinet: {
      width: '100%',
      maxWidth: 360,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      padding: spacing.md,
      gap: spacing.md,
      ...shadow.card,
      shadowOpacity: 0.25,
      shadowRadius: 14,
      borderWidth: 3,
      borderColor: resolved === 'dark' ? '#0b1220' : '#0d3d3a',
    },
    cabinetTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    cabinetLabel: {
      fontSize: 10,
      letterSpacing: 3,
      color: colors.primarySoft,
      fontWeight: '800',
    },
    bulbRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
    },
    bulb: {
      width: 8, height: 8, borderRadius: 4,
    },

    reels: {
      flexDirection: 'row',
      backgroundColor: '#0a0a0a',
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.sm,
      borderWidth: 2,
      borderColor: '#f5c842',
    },
    reel: {
      flex: 1,
      height: REEL_HEIGHT,
      backgroundColor: '#fffaf0',
      borderRadius: radius.sm,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#d4a017',
    },
    reelGlare: {
      position: 'absolute',
      top: 0, left: 0, right: 0, height: REEL_HEIGHT / 3,
      backgroundColor: 'rgba(255,255,255,0.4)',
      zIndex: 2,
      pointerEvents: 'none',
    },
    reelInner: {
      width: '100%',
    },
    reelCell: {
      height: REEL_HEIGHT,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    payline: {
      position: 'absolute',
      left: -4, right: -4,
      top: REEL_HEIGHT / 2 + spacing.sm - 1,
      height: 2,
      backgroundColor: '#f5c842',
      opacity: 0.7,
      zIndex: 3,
    },

    cabinetBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    creditBox: {
      flex: 1,
      backgroundColor: '#0a0a0a',
      borderRadius: radius.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: '#f5c842',
    },
    creditLabel: {
      fontSize: 9,
      letterSpacing: 2,
      color: '#f5c842',
      fontWeight: '700',
    },
    creditValue: {
      fontSize: fontSize.lg,
      color: '#fffaf0',
      fontWeight: '900',
      letterSpacing: 1,
      fontVariant: ['tabular-nums'],
    },

    leverWrap: {
      width: 56,
      alignItems: 'center',
    },
    leverShaft: {
      width: 6,
      height: 56,
      backgroundColor: '#5a5a5a',
      borderRadius: 3,
    },
    leverKnob: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#e63946',
      borderWidth: 3,
      borderColor: '#0a0a0a',
      marginTop: -8,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 3 },
    },

    flashOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 5,
      pointerEvents: 'none',
    },

    resultBanner: {
      width: '100%',
      maxWidth: 360,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 2,
    },
    resultBuy: { backgroundColor: colors.incomeLight, borderColor: colors.income },
    resultSkip: { backgroundColor: colors.expenseLight, borderColor: colors.expense },
    resultText: {
      fontSize: fontSize.xl,
      fontWeight: '900',
      letterSpacing: 2,
    },
    resultSub: {
      fontSize: fontSize.xs,
      marginTop: 2,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontWeight: '700',
    },

    spinBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.md + 4,
      borderRadius: radius.full,
      minWidth: 220,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: resolved === 'dark' ? '#0b1220' : '#0d3d3a',
      ...shadow.card,
    },
    spinBtnDisabled: { opacity: 0.5 },
    spinText: {
      fontSize: fontSize.md,
      fontWeight: '900',
      color: colors.white,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
  }), [colors, resolved]);

  const spin = useCallback(() => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Decide outcome
    const isBuy = Math.random() < 0.5;
    // Pick a winning symbol if buy, else CircleX
    const targetIdx = isBuy
      ? Math.floor(Math.random() * (SYMBOLS.length - 1))
      : SYMBOLS.length - 1;

    const newStrips = [
      buildStrip(targetIdx, 8),
      buildStrip(targetIdx, 10),
      buildStrip(targetIdx, 12),
    ];
    setStrips(newStrips);

    // Lever pull-down animation
    Animated.sequence([
      Animated.timing(leverY, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(leverY, { toValue: 0, duration: 280, easing: Easing.out(Easing.elastic(1.4)), useNativeDriver: true }),
    ]).start();

    // Reset each reel position
    reelAnims.forEach((v) => v.setValue(0));

    // Animate each reel — staggered durations
    const baseDur = 1100;
    const reelTimings = [baseDur, baseDur + 500, baseDur + 1100];

    // Tick haptic when each reel lands.
    reelTimings.forEach((ms) => {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, ms);
    });

    Animated.parallel([
      Animated.timing(reelAnims[0], {
        toValue: 1,
        duration: reelTimings[0],
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(reelAnims[1], {
        toValue: 1,
        duration: reelTimings[1],
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(reelAnims[2], {
        toValue: 1,
        duration: reelTimings[2],
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setResult(isBuy ? 'buy' : 'skip');
      setSpinning(false);

      if (isBuy) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    });
  }, [spinning, flash, leverY, reelAnims]);

  const leverTranslate = leverY.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const flashColor = result === 'buy'
    ? 'rgba(34,197,94,0.35)'
    : result === 'skip'
      ? 'rgba(220,38,38,0.35)'
      : 'transparent';

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Gacha" showLogo={false} showActions={false} />
      <View style={styles.content}>
        <Text style={styles.title}>
          <Text style={{ color: colors.income }}>Buy</Text>
          {' or '}
          <Text style={{ color: colors.expense }}>Skip</Text>
        </Text>
        <Text style={styles.sub}>Pull the lever. Three of a kind says BUY. A red ✕ means walk away.</Text>

        <View style={styles.cabinet}>
          <View style={styles.cabinetTopRow}>
            <Text style={styles.cabinetLabel}>★ NABUNG ★</Text>
            <Text style={styles.cabinetLabel}>JACKPOT</Text>
          </View>

          <View style={styles.bulbRow}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.bulb,
                  { backgroundColor: i % 2 === 0 ? '#f5c842' : '#e63946' },
                ]}
              />
            ))}
          </View>

          <View style={styles.reels}>
            <View style={styles.payline} />
            {strips.map((strip, idx) => {
              // Each strip has SYMBOLS.length * cycles + 1 cells, last cell is target at bottom.
              const totalCells = strip.length;
              const totalScroll = (totalCells - 1) * REEL_HEIGHT;
              const translateY = reelAnims[idx].interpolate({
                inputRange: [0, 1],
                outputRange: [0, -totalScroll],
              });
              return (
                <View key={idx} style={styles.reel}>
                  <View style={styles.reelGlare} />
                  <Animated.View style={[styles.reelInner, { transform: [{ translateY }] }]}>
                    {strip.map((s, i) => {
                      const Icon = s.Icon;
                      const color = s.win
                        ? (s.key === 'crown' ? '#d4a017' : s.key === 'gem' ? '#0ea5e9' : colors.primary)
                        : colors.expense;
                      return (
                        <View key={`${idx}-${i}-${s.key}`} style={styles.reelCell}>
                          <Icon size={44} color={color} strokeWidth={2.4} />
                        </View>
                      );
                    })}
                  </Animated.View>
                </View>
              );
            })}
            <Animated.View
              pointerEvents="none"
              style={[styles.flashOverlay, { backgroundColor: flashColor, opacity: flash }]}
            />
          </View>

          <View style={styles.cabinetBottomRow}>
            <View style={styles.creditBox}>
              <Text style={styles.creditLabel}>RESULT</Text>
              <Text style={styles.creditValue}>
                {result === 'buy' ? 'BUY' : result === 'skip' ? 'SKIP' : '— — —'}
              </Text>
            </View>
            <View style={styles.leverWrap}>
              <View style={styles.leverShaft} />
              <Animated.View style={[styles.leverKnob, { transform: [{ translateY: leverTranslate }] }]} />
            </View>
          </View>
        </View>

        {result && (
          <View style={[styles.resultBanner, result === 'buy' ? styles.resultBuy : styles.resultSkip]}>
            <Text style={[styles.resultText, { color: result === 'buy' ? colors.income : colors.expense }]}>
              {result === 'buy' ? 'JACKPOT — BUY IT' : 'NO MATCH — SKIP IT'}
            </Text>
            <Text style={[styles.resultSub, { color: result === 'buy' ? colors.income : colors.expense }]}>
              {result === 'buy' ? 'The dice favor you' : 'Save your money'}
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
          onPress={spin}
          disabled={spinning}
        >
          <Text style={styles.spinText}>
            {spinning ? 'Rolling…' : result ? 'Pull Again' : 'Pull Lever'}
          </Text>
        </Pressable>
      </View>
      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} />
    </SafeAreaView>
  );
}
