import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize, shadow } from '../constants/theme';

export type ToastVariant = 'success' | 'error' | 'info';

interface Props {
  variant: ToastVariant;
  message: string;
  duration: number;
  onDismiss: () => void;
}

export default function Toast({ variant, message, duration, onDismiss }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: insets.top + 8,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderLeftWidth: 4,
      ...shadow.card,
    },
    success: { borderLeftColor: colors.primary, backgroundColor: colors.primarySoft },
    error: { borderLeftColor: colors.expense, backgroundColor: colors.expenseLight },
    info: { borderLeftColor: colors.textSecondary, backgroundColor: colors.card },
    text: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
    close: { padding: 4 },
  }), [colors, insets.top]);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 250 });
    opacity.value = withTiming(1, { duration: 250 });
    if (variant === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (variant === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const t = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }, duration);
    return () => clearTimeout(t);
  }, [variant, duration, onDismiss, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : Info;
  const iconColor = variant === 'success' ? colors.primary : variant === 'error' ? colors.expense : colors.textSecondary;
  const variantStyle = variant === 'success' ? styles.success : variant === 'error' ? styles.error : styles.info;

  return (
    <Animated.View style={[styles.container, variantStyle, animStyle]} pointerEvents="box-none">
      <Icon size={20} color={iconColor} />
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
      <Pressable style={styles.close} onPress={onDismiss} hitSlop={8}>
        <X size={16} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}
