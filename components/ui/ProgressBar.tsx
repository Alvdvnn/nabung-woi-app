import { StyleProp, View, ViewStyle } from 'react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  /** 0..1. Values above 1 fill the bar and switch to the `over` color. */
  value: number;
  color?: string;
  /** Color used once value exceeds 1 (budget blown). */
  over?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export default function ProgressBar({ value, color, over, height = 8, style }: Props) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  const fill = value > 1 ? (over ?? colors.expense) : (color ?? colors.primary);
  return (
    <View
      style={[
        { height, borderRadius: radius.full, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View style={{ width: `${Math.max(pct * 100, value > 0 ? 2 : 0)}%`, height: '100%', borderRadius: radius.full, backgroundColor: fill }} />
    </View>
  );
}
