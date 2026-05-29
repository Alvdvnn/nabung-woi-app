import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Info } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, spacing, fontSize } from '../constants/theme';

export type ConfirmTone = 'danger' | 'primary' | 'info';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();

  const accent =
    tone === 'danger' ? colors.expense : tone === 'info' ? colors.textSecondary : colors.primary;
  const accentLight =
    tone === 'danger' ? colors.expenseLight : tone === 'info' ? colors.border : colors.primarySoft;
  const Icon = tone === 'danger' ? AlertTriangle : Info;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: spacing.lg,
        },
        sheet: {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: accentLight,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        },
        title: {
          fontSize: fontSize.lg,
          fontWeight: '800',
          color: colors.textPrimary,
        },
        message: {
          fontSize: fontSize.sm,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        actions: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        btn: {
          flex: 1,
          paddingVertical: spacing.md,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cancel: {
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        confirm: { backgroundColor: accent },
        cancelText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
        confirmText: { fontSize: fontSize.md, fontWeight: '700', color: colors.white },
      }),
    [colors, accent, accentLight],
  );

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={() => {}}>
          <View style={styles.sheet}>
            <View style={styles.iconWrap}>
              <Icon size={22} color={accent} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel} disabled={busy}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.confirm, busy && { opacity: 0.6 }]}
                onPress={onConfirm}
                disabled={busy}
              >
                <Text style={styles.confirmText}>{busy ? '…' : confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
