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

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Let the content scroll when it can outgrow the screen. */
  scroll?: boolean;
}

/**
 * Bottom sheet built on Modal so it behaves identically on native and web.
 * Handles the backdrop, the grab handle, the close affordance, keyboard
 * avoidance, and home-indicator padding once, instead of in every caller.
 */
export default function Sheet({ visible, title, subtitle, onClose, children, scroll = false }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
          paddingBottom: spacing.xl + insets.bottom,
          maxHeight: '88%',
          gap: spacing.md,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginBottom: spacing.sm,
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
        },
      }),
    [colors, insets.bottom],
  );

  const body = scroll ? (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    children
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
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
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
                <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
                  <X size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}
            {body}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
