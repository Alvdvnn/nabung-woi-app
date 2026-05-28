import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dices, Calculator, ChevronLeft } from 'lucide-react-native';
import { useCalculator } from '../hooks/useCalculator';
import { spacing, fontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showActions?: boolean;
}

export default function TopBar({ title, showBack, showLogo = true, showActions = true }: Props) {
  const router = useRouter();
  const calc = useCalculator();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
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
      overflow: 'hidden',
    },
    logoImg: {
      width: 28,
      height: 28,
      resizeMode: 'contain',
    },
    brand: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [colors]);

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
              <Image source={require('../assets/icon.png')} style={styles.logoImg} />
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
          <Pressable onPress={calc.open} hitSlop={8} style={styles.iconBtn}>
            <Calculator size={20} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
