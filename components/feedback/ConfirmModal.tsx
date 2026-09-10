import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Info } from 'lucide-react-native';
import Button from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { elevation, fontSize, radius, spacing, weight } from '../../constants/theme';

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
    tone === 'danger' ? colors.expense : tone === 'info' ? colors.info : colors.primary;
  const accentLight =
    tone === 'danger' ? colors.expenseLight : tone === 'info' ? colors.infoLight : colors.primarySoft;
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
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          ...elevation[4],
        },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: radius.full,
          backgroundColor: accentLight,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        },
        title: { fontSize: fontSize.lg, fontWeight: weight.heavy, color: colors.textPrimary },
        message: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
        actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
      }),
    [colors, accentLight],
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
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={cancelLabel}>
        <Pressable onPress={() => {}}>
          <View style={styles.sheet}>
            <View style={styles.iconWrap}>
              <Icon size={22} color={accent} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.actions}>
              <Button label={cancelLabel} onPress={onCancel} variant="secondary" disabled={busy} fullWidth />
              <Button
                label={confirmLabel}
                onPress={onConfirm}
                variant={tone === 'danger' ? 'danger' : 'primary'}
                loading={busy}
                fullWidth
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
