import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Sheet from '../ui/Sheet';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { Account } from '../../utils/storage';
import { findAccountType } from '../../constants/accountTypes';
import { formatIDR } from '../../utils/format';
import { useT } from '../../i18n';
import { tBuiltin } from '../../i18n/labels';

interface Props {
  visible: boolean;
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function AccountPickerSheet({ visible, accounts, selectedId, onSelect, onClose }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { balances } = useData();
  const t = useT();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { maxHeight: 380 },
        empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 60,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          marginBottom: spacing.xs,
        },
        rowActive: { backgroundColor: colors.primarySoft },
        iconWrap: {
          width: 38,
          height: 38,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        info: { flex: 1 },
        name: { fontSize: fontSize.md, fontWeight: weight.semibold, color: colors.textPrimary },
        meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
        addBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: 48,
          marginTop: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.primary,
          borderStyle: 'dashed',
        },
        addText: { fontSize: fontSize.sm, fontWeight: weight.semibold, color: colors.primary },
      }),
    [colors],
  );

  return (
    <Sheet visible={visible} title={t('accountPicker.choose')} onClose={onClose}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {accounts.length === 0 ? (
          <Text style={styles.empty}>{t('accountPicker.empty')}</Text>
        ) : (
          accounts.map((a) => {
            const type = findAccountType(a.typeId);
            const TypeIcon = type.icon;
            const active = a.id === selectedId;
            return (
              <Pressable
                key={a.id}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && !active && { backgroundColor: colors.surfaceSunken },
                ]}
                onPress={() => {
                  onSelect(a.id);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={a.name}
              >
                <View style={styles.iconWrap}>
                  <TypeIcon size={18} color={colors.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{a.name}</Text>
                  {/* Showing the live balance here removes a round-trip to the
                      dashboard when picking which account to spend from. */}
                  <Text style={styles.meta}>
                    {`${tBuiltin(t, 'accountTypes', type.id)} · ${formatIDR(balances.get(a.id) ?? a.startingBalance)}`}
                  </Text>
                </View>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })
        )}
        <Pressable
          style={styles.addBtn}
          accessibilityRole="button"
          onPress={() => {
            onClose();
            router.push('/settings');
          }}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addText}>{t('account.add')}</Text>
        </Pressable>
      </ScrollView>
    </Sheet>
  );
}
