import { useMemo, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { useT } from '../../i18n';

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Let the content scroll when it can outgrow the screen. */
  scroll?: boolean;
  /** Pinned below the content (action buttons); never scrolls away. */
  footer?: ReactNode;
}

/**
 * Bottom sheet built on Modal so it behaves identically on native and web.
 * Handles the backdrop, the grab handle, the close affordance, keyboard
 * avoidance (visualViewport on web), and home-indicator padding once.
 */
export default function Sheet({ visible, title, subtitle, onClose, children, scroll = false, footer }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  // Native uses KeyboardAvoidingView; on web the sheet is lifted by the inset.
  const keyboard = useKeyboardInset();
  const webLift = Platform.OS === 'web' ? keyboard : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
        sheet: {
          backgroundColor: colors.bg,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg + Math.max(insets.bottom, webLift),
          maxHeight: '90%',
          gap: spacing.md,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginBottom: spacing.xs,
        },
        header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
        headerMain: { flex: 1 },
        title: { fontSize: fontSize.xl, fontWeight: weight.heavy, color: colors.textPrimary },
        subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
        close: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -spacing.sm,
          marginRight: -spacing.sm,
          borderRadius: radius.full,
        },
        body: { flexShrink: 1 },
        footer: { paddingTop: spacing.xs },
      }),
    [colors, insets.bottom, webLift],
  );

  const body = scroll ? (
    <ScrollView
      style={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: spacing.xs }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.body}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            {title ? (
              <View style={styles.header}>
                <View style={styles.headerMain}>
                  <Text style={styles.title} accessibilityRole="header">
                    {title}
                  </Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.surfaceSunken }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                >
                  <X size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}
            {body}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
