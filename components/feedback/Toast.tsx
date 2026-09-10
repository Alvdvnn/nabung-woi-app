import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize, weight, elevation, motion } from '../../constants/theme';
import type { ToastAction } from '../../context/ToastContext';

export type ToastVariant = 'success' | 'error' | 'info';

interface Props {
  variant: ToastVariant;
  message: string;
  duration: number;
  action?: ToastAction;
  onDismiss: () => void;
}

export default function Toast({ variant, message, duration, action, onDismiss }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  const accent =
    variant === 'success' ? colors.primary : variant === 'error' ? colors.expense : colors.info;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          top: insets.top + spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingLeft: spacing.md,
          paddingRight: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: accent,
          ...elevation[3],
        },
        text: { flex: 1, fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.textPrimary },
        action: {
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
        },
        actionText: {
          fontSize: fontSize.sm,
          fontWeight: weight.heavy,
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
      }),
    [colors, insets.top, accent],
  );

  useEffect(() => {
    translateY.value = withTiming(0, { duration: motion.base });
    opacity.value = withTiming(1, { duration: motion.base });
    if (variant === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else if (variant === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: motion.fast });
      opacity.value = withTiming(0, { duration: motion.fast }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }, duration);
    return () => clearTimeout(timer);
  }, [variant, duration, onDismiss, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : Info;

  return (
    <Animated.View
      style={[styles.container, animStyle, { pointerEvents: 'box-none' }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Icon size={20} color={accent} />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      {action ? (
        <Pressable
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => {
            action.onPress();
            onDismiss();
          }}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.close} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss">
          <X size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
}
