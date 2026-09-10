import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import { radius as radiusTokens, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder shown while the store hydrates, instead of a blank screen. */
export function Skeleton({ width = '100%', height = 16, radius = radiusTokens.sm, style }: Props) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Card-shaped skeleton used by list and dashboard placeholders. */
export function SkeletonCard({ lines = 2, height = 72 }: { lines?: number; height?: number }) {
  const { colors } = useTheme();
  const rows = useMemo(() => Array.from({ length: lines }, (_, i) => i), [lines]);
  return (
    <View
      style={{
        minHeight: height,
        backgroundColor: colors.surface,
        borderRadius: radiusTokens.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.sm,
        justifyContent: 'center',
      }}
    >
      {rows.map((i) => (
        <Skeleton key={i} width={i === 0 ? '60%' : '85%'} height={i === 0 ? 14 : 12} />
      ))}
    </View>
  );
}
