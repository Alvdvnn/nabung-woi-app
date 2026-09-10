import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Screen frame. Horizontal safe-area insets only: the top is owned by TopBar
 * and the bottom by the tab bar / FAB offsets, both of which apply their own
 * inset. Applying it here too would double-pad on notched devices.
 */
export default function Screen({ children, style }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]} edges={['left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

export function Row({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;
}
