import { StyleProp, View, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  Icon: LucideIcon;
  /** Outer diameter in points. The glyph is roughly half of it. */
  size?: number;
  /** Glyph color; defaults to primary. */
  tint?: string;
  /** Background; defaults to primarySoft. */
  bg?: string;
  /** Rounded square instead of a circle. */
  square?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The tinted circle-with-icon used on rows, tiles, and headers. */
export default function IconBadge({ Icon, size = 40, tint, bg, square = false, style }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: square ? radius.md : radius.full,
          backgroundColor: bg ?? colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon size={Math.round(size * 0.46)} color={tint ?? colors.primary} />
    </View>
  );
}
