import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, radius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { hapticSelection } from '../../utils/haptics';

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const W = 50;
const H = 30;
const KNOB = 24;
const PAD = 3;

/**
 * Custom toggle so native and web look and animate the same. 50x30 with a
 * 44pt hit area via hitSlop.
 */
export default function Switch({ value, onValueChange, disabled = false, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: motion.fast });
  }, [value, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (W - KNOB - PAD * 2) }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          width: W,
          height: H,
          borderRadius: radius.full,
          padding: PAD,
          justifyContent: 'center',
          borderWidth: 1,
        },
        knob: {
          width: KNOB,
          height: KNOB,
          borderRadius: radius.full,
          backgroundColor: colors.white,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onValueChange(!value);
      }}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.primary : colors.surfaceSunken,
          borderColor: value ? colors.primary : colors.borderStrong,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View style={[styles.knob, knobStyle]} />
    </Pressable>
  );
}
