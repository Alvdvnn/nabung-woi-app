import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentBottomForFab, fabBottomForFullScreen } from '../constants/layout';
import { hapticError, hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import {
  Plus,
  Coins,
  Gem,
  DollarSign,
  CircleX,
  Sparkles,
  Crown,
  LucideIcon,
} from 'lucide-react-native';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import Fab from '../components/ui/Fab';
import { elevation, fontSize, radius, spacing, weight } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useT } from '../i18n';

type Result = 'buy' | 'skip' | null;
type SymbolTone = 'primary' | 'warning' | 'info' | 'expense';

const REEL_HEIGHT = 92;

// react-native-web has no native animated module; asking for it only logs a warning.
const NATIVE_DRIVER = Platform.OS !== 'web';

interface ReelSymbol {
  Icon: LucideIcon;
  key: string;
  win: boolean;
  tone: SymbolTone;
}

const SYMBOLS: ReelSymbol[] = [
  { key: 'coin', Icon: Coins, win: true, tone: 'primary' },
  { key: 'gem', Icon: Gem, win: true, tone: 'info' },
  { key: 'dollar', Icon: DollarSign, win: true, tone: 'primary' },
  { key: 'crown', Icon: Crown, win: true, tone: 'warning' },
  { key: 'sparkle', Icon: Sparkles, win: true, tone: 'primary' },
  { key: 'x', Icon: CircleX, win: false, tone: 'expense' },
];

// Build a long strip; result symbol placed at a known index.
function buildStrip(targetIdx: number, cycles: number) {
  const strip: ReelSymbol[] = [];
  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < SYMBOLS.length; i++) strip.push(SYMBOLS[i]);
  }
  strip.push(SYMBOLS[targetIdx]);
  return strip;
}

/**
 * Buy-or-skip slot machine. A root stack screen, not a tab: Expo Router 58
 * redirects away from a tab hidden with `href: null`, so a hidden tab can no
 * longer be opened from the TopBar dice.
 *
 * Every color is a theme token. The reels sit on `surface`, so the symbol
 * tones (primary, info, warning, expense) keep AA contrast in every palette
 * and mode.
 */
export default function GachaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const t = useT();
  const [result, setResult] = useState<Result>(null);
  const [spinning, setSpinning] = useState(false);
  const [strips, setStrips] = useState<ReelSymbol[][]>(() => [
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
    content: {
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: contentBottomForFab(insets.bottom),
      gap: spacing.lg,
    },

    title: {
      fontSize: fontSize.xxl,
      fontWeight: weight.black,
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
      ...elevation[3],
      borderWidth: 3,
      borderColor: colors.primaryDark,
    },
    cabinetTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    cabinetLabel: {
      fontSize: fontSize.xs,
      letterSpacing: 3,
      color: colors.onPrimary,
      fontWeight: weight.heavy,
    },
    bulbRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
    },
    bulb: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.onPrimary,
    },
    bulbDim: { opacity: 0.4 },

    reels: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSunken,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.sm,
      borderWidth: 2,
      borderColor: colors.borderStrong,
    },
    reel: {
      flex: 1,
      height: REEL_HEIGHT,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    reelGlare: {
      position: 'absolute',
      top: 0, left: 0, right: 0, height: REEL_HEIGHT / 3,
      backgroundColor: colors.white,
      opacity: resolved === 'dark' ? 0.05 : 0.35,
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
      backgroundColor: colors.warning,
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
      backgroundColor: colors.surfaceSunken,
      borderRadius: radius.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    creditLabel: {
      fontSize: fontSize.xs,
      letterSpacing: 2,
      color: colors.textMuted,
      fontWeight: weight.bold,
    },
    creditValue: {
      fontSize: fontSize.lg,
      color: colors.textPrimary,
      fontWeight: weight.black,
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
      backgroundColor: colors.onPrimary,
      opacity: 0.55,
      borderRadius: 3,
    },
    leverKnob: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.expense,
      borderWidth: 3,
      borderColor: colors.surface,
      marginTop: -8,
      ...elevation[2],
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
      fontWeight: weight.black,
      letterSpacing: 2,
    },
    resultSub: {
      fontSize: fontSize.xs,
      marginTop: 2,
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontWeight: weight.bold,
    },

    spinBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.md + 4,
      borderRadius: radius.full,
      minWidth: 220,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primaryDark,
      ...elevation[2],
    },
    spinBtnDisabled: { opacity: 0.5 },
    spinText: {
      fontSize: fontSize.md,
      fontWeight: weight.black,
      color: colors.onPrimary,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
  }), [colors, resolved, insets.bottom]);

  const spin = useCallback(() => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);

    hapticMedium();

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
      Animated.timing(leverY, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(leverY, { toValue: 0, duration: 280, easing: Easing.out(Easing.elastic(1.4)), useNativeDriver: NATIVE_DRIVER }),
    ]).start();

    // Reset each reel position
    reelAnims.forEach((v) => v.setValue(0));

    // Animate each reel — staggered durations
    const baseDur = 1100;
    const reelTimings = [baseDur, baseDur + 500, baseDur + 1100];

    // Tick haptic when each reel lands.
    reelTimings.forEach((ms) => {
      setTimeout(() => {
        hapticLight();
      }, ms);
    });

    Animated.parallel(
      reelAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: reelTimings[i],
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ),
    ).start(() => {
      setResult(isBuy ? 'buy' : 'skip');
      setSpinning(false);

      if (isBuy) {
        hapticSuccess();
      } else {
        hapticError();
      }

      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(flash, { toValue: 0, duration: 320, useNativeDriver: NATIVE_DRIVER }),
      ]).start();
    });
  }, [spinning, flash, leverY, reelAnims]);

  const leverTranslate = leverY.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  // 0x59 is 35% alpha on the six-digit semantic token.
  const flashColor = result === 'buy'
    ? `${colors.income}59`
    : result === 'skip'
      ? `${colors.expense}59`
      : 'transparent';

  const spinLabel = spinning ? t('gacha.rolling') : result ? t('gacha.pullAgain') : t('gacha.pullLever');

  return (
    <Screen>
      <TopBar title={t('gacha.title')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          <Text style={{ color: colors.income }}>{t('gacha.buy')}</Text>
          {` ${t('gacha.or')} `}
          <Text style={{ color: colors.expense }}>{t('gacha.skip')}</Text>
        </Text>
        <Text style={styles.sub}>{t('gacha.sub')}</Text>

        <View style={styles.cabinet}>
          <View style={styles.cabinetTopRow}>
            <Text style={styles.cabinetLabel}>{t('gacha.cabinet')}</Text>
            <Text style={styles.cabinetLabel}>{t('gacha.jackpot')}</Text>
          </View>

          <View style={styles.bulbRow}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={[styles.bulb, i % 2 === 1 && styles.bulbDim]} />
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
                      return (
                        <View key={`${idx}-${i}-${s.key}`} style={styles.reelCell}>
                          <Icon size={44} color={colors[s.tone]} strokeWidth={2.4} />
                        </View>
                      );
                    })}
                  </Animated.View>
                </View>
              );
            })}
            <Animated.View
              style={[styles.flashOverlay, { backgroundColor: flashColor, opacity: flash }]}
            />
          </View>

          <View style={styles.cabinetBottomRow}>
            <View style={styles.creditBox}>
              <Text style={styles.creditLabel}>{t('gacha.result')}</Text>
              <Text style={styles.creditValue}>
                {result === 'buy' ? t('gacha.buyUp') : result === 'skip' ? t('gacha.skipUp') : '· · ·'}
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
              {result === 'buy' ? t('gacha.bannerBuy') : t('gacha.bannerSkip')}
            </Text>
            <Text style={[styles.resultSub, { color: result === 'buy' ? colors.income : colors.expense }]}>
              {result === 'buy' ? t('gacha.subBuy') : t('gacha.subSkip')}
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
          onPress={spin}
          disabled={spinning}
          accessibilityRole="button"
          accessibilityLabel={spinLabel}
          accessibilityState={{ disabled: spinning, busy: spinning }}
        >
          <Text style={styles.spinText}>{spinLabel}</Text>
        </Pressable>
      </ScrollView>
      <Fab
        Icon={Plus}
        bottom={fabBottomForFullScreen(insets.bottom)}
        onPress={() => router.push('/')}
        accessibilityLabel={t('input.headingAdd')}
      />
    </Screen>
  );
}
