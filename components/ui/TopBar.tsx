import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calculator, ChevronLeft, Dices } from 'lucide-react-native';
import { useCalculator } from '../../hooks/useCalculator';
import { fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';

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
  const t = useT();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
        right: { flexDirection: 'row', alignItems: 'center' },
        logoWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.xs },
        logoBadge: { width: 28, height: 28, borderRadius: radius.sm, overflow: 'hidden' },
        logoImg: { width: 28, height: 28, resizeMode: 'contain' },
        brand: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        title: {
          fontSize: fontSize.lg,
          fontWeight: weight.bold,
          color: colors.textPrimary,
          letterSpacing: 0.4,
          paddingLeft: spacing.xs,
        },
        // 44x44 keeps every header control at the minimum touch target.
        iconBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
      }),
    [colors],
  );

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
        ) : showLogo ? (
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <Image source={require('../../assets/icon.png')} style={styles.logoImg} />
            </View>
            {/* Brand name is not translated. */}
            <Text style={styles.brand}>Nabung Woi</Text>
          </View>
        ) : null}
        {title ? (
          <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      {showActions ? (
        <View style={styles.right}>
          <Pressable
            onPress={() => router.push('/gacha')}
            style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.gacha')}
          >
            <Dices size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={calc.open}
            style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.surfaceSunken }]}
            accessibilityRole="button"
            accessibilityLabel="Calculator"
          >
            <Calculator size={20} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
