import { useMemo, ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ElevationLevel, elevation, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  children: ReactNode;
  /** 0-4. Shadows carry depth on light; dark relies on the surface tint. */
  level?: ElevationLevel;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The one surface primitive. Every panel in the app is a Card. */
export default function Card({ children, level = 1, padded = true, style }: Props) {
  const { colors, resolved } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...(resolved === 'dark' ? {} : elevation[level]),
        },
        padded: { padding: spacing.lg },
      }),
    [colors, resolved, level],
  );

  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}
