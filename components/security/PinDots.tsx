import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  length: number;
  /** Slots drawn before any digit is typed. Grows past this as the PIN grows. */
  minSlots: number;
  /** Increment to play the wrong-PIN shake. */
  shakeKey: number;
  error: boolean;
}

function Dot({ filled, error }: { filled: boolean; error: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(filled ? 1 : 0.6);
  useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.6, { damping: 12, stiffness: 320 });
  }, [filled, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[
        {
          width: 16,
          height: 16,
          borderRadius: radius.full,
          borderWidth: 2,
          borderColor: error ? colors.expense : filled ? colors.primary : colors.borderStrong,
          backgroundColor: error ? colors.expense : filled ? colors.primary : 'transparent',
        },
        anim,
      ]}
    />
  );
}

/** Animated PIN indicator. The whole row shakes on a wrong attempt. */
export default function PinDots({ length, minSlots, shakeKey, error }: Props) {
  const tx = useSharedValue(0);
  useEffect(() => {
    if (shakeKey === 0) return;
    tx.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeKey, tx]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  const slots = Math.max(minSlots, length);
  return (
    <Animated.View
      style={[{ flexDirection: 'row', gap: spacing.md, justifyContent: 'center', minHeight: 20 }, anim]}
      accessibilityLabel={`${length} digits entered`}
    >
      {Array.from({ length: slots }, (_, i) => (
        <Dot key={i} filled={i < length} error={error} />
      ))}
      <View />
    </Animated.View>
  );
}
