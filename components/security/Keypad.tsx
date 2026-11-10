import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Check, Delete } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { hapticLight } from '../../utils/haptics';
import { useT } from '../../i18n';

interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitEnabled: boolean;
  disabled?: boolean;
}

const KEY = 72;

function Key({
  children,
  onPress,
  label,
  disabled,
  tone,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  tone: 'digit' | 'action' | 'primary';
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg = tone === 'primary' ? colors.primary : tone === 'digit' ? colors.surface : 'transparent';
  const border = tone === 'digit' ? colors.border : 'transparent';

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: KEY,
            height: KEY,
            borderRadius: radius.full,
            backgroundColor: bg,
            borderWidth: 1,
            borderColor: border,
            alignItems: 'center',
            justifyContent: 'center',
          },
          anim,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** 3x4 numeric keypad: digits, backspace, and a confirm key. */
export default function Keypad({ onDigit, onBackspace, onSubmit, submitEnabled, disabled = false }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: { gap: spacing.md, alignItems: 'center' },
        row: { flexDirection: 'row', gap: spacing.lg },
        digit: { fontSize: fontSize.xxl, fontWeight: weight.semibold, color: colors.textPrimary },
      }),
    [colors],
  );

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((d) => (
            <Key key={d} onPress={() => onDigit(d)} label={d} disabled={disabled} tone="digit">
              <Text style={styles.digit}>{d}</Text>
            </Key>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <Key onPress={onBackspace} label={t('pinLock.backspace')} disabled={disabled} tone="action">
          <Delete size={24} color={colors.textSecondary} />
        </Key>
        <Key onPress={() => onDigit('0')} label="0" disabled={disabled} tone="digit">
          <Text style={styles.digit}>0</Text>
        </Key>
        <Key onPress={onSubmit} label={t('pinLock.unlock')} disabled={disabled || !submitEnabled} tone="primary">
          <Check size={26} color={colors.onPrimary} />
        </Key>
      </View>
    </View>
  );
}
