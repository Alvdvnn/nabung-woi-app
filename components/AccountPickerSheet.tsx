import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Check, X, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, fontSize } from '../constants/theme';
import { Account } from '../utils/storage';
import { findAccountType } from '../constants/accountTypes';

interface Props {
  visible: boolean;
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function AccountPickerSheet({ visible, accounts, selectedId, onSelect, onClose }: Props) {
  const router = useRouter();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Account</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView style={styles.list}>
          {accounts.length === 0 ? (
            <Text style={styles.empty}>No accounts yet. Add one in Settings.</Text>
          ) : (
            accounts.map((a) => {
              const type = findAccountType(a.typeId);
              const TypeIcon = type.icon;
              const active = a.id === selectedId;
              return (
                <Pressable
                  key={a.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => { onSelect(a.id); onClose(); }}
                >
                  <View style={styles.iconWrap}>
                    <TypeIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{a.name}</Text>
                    <Text style={styles.type}>{type.name}</Text>
                  </View>
                  {active && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            })
          )}
          <Pressable
            style={styles.addBtn}
            onPress={() => { onClose(); router.push('/settings'); }}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addText}>Add Account</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  rowActive: { backgroundColor: colors.primarySoft },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  type: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
});
