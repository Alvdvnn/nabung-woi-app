import { Children, Fragment, ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Card from './Card';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title?: string;
  /** Short helper text under the group. */
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Titled card that stacks `ListRow`s with hairline dividers, the way iOS and
 * Material group settings. Null children are skipped so conditional rows work.
 */
export default function SectionGroup({ title, footer, children, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.sm },
        title: {
          fontSize: fontSize.xs,
          fontWeight: weight.heavy,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          paddingHorizontal: spacing.xs,
        },
        divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg },
        footer: { fontSize: fontSize.xs, color: colors.textMuted, paddingHorizontal: spacing.xs, lineHeight: 17 },
      }),
    [colors],
  );

  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {rows.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {child}
          </Fragment>
        ))}
      </Card>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}
