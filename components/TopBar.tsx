import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, Dices, History, ChevronLeft } from 'lucide-react-native';
import { colors, spacing, fontSize } from '../constants/theme';

interface Props {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showActions?: boolean;
}

export default function TopBar({ title, showBack, showLogo = true, showActions = true }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
        ) : showLogo ? (
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <Wallet size={16} color={colors.white} />
            </View>
            <Text style={styles.brand}>Nabung Woi</Text>
          </View>
        ) : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>

      {showActions && (
        <View style={styles.right}>
          <Pressable onPress={() => router.push('/gacha')} hitSlop={8} style={styles.iconBtn}>
            <Dices size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => router.push('/history')} hitSlop={8} style={styles.iconBtn}>
            <History size={20} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  title: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
