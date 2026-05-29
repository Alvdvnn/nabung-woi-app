import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../hooks/useTheme';
import { fontSize, spacing } from '../constants/theme';

interface Props {
  onDone: () => void;
}

const HOLD_MS = 500;
const FADE_MS = 280;

export default function SplashIntro({ onDone }: Props) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const exit = useRef(new Animated.Value(1)).current;

  const version = Constants.expoConfig?.version ?? '';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const hold = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone();
      });
    }, HOLD_MS);

    return () => clearTimeout(hold);
  }, [fade, scale, exit, onDone]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        },
        center: { alignItems: 'center', gap: spacing.md },
        logo: { width: 112, height: 112, borderRadius: 24 },
        brand: {
          fontSize: fontSize.xxl,
          fontWeight: '900',
          color: colors.textPrimary,
          letterSpacing: -0.5,
        },
        version: {
          fontSize: fontSize.sm,
          color: colors.textMuted,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }),
    [colors],
  );

  return (
    <Animated.View style={[styles.root, { opacity: exit }]}>
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale }] }]}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={styles.brand}>Nabung Woi</Text>
        {version ? <Text style={styles.version}>v{version}</Text> : null}
      </Animated.View>
      <View />
    </Animated.View>
  );
}
