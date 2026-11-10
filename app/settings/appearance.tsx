import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Moon, Smartphone, Sun } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import SegmentedControl, { Segment } from '../../components/ui/SegmentedControl';
import { PALETTES, PALETTE_IDS, PaletteId, fontSize, radius, spacing, weight } from '../../constants/theme';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { useLocale, useT } from '../../i18n';
import { Locale } from '../../i18n/dicts';
import { hapticSelection } from '../../utils/haptics';

const PALETTE_NAME_KEYS = {
  default: 'settings.paletteDefault',
  pastel: 'settings.palettePastel',
  mono: 'settings.paletteMono',
  ocean: 'settings.paletteOcean',
  forest: 'settings.paletteForest',
  midnight: 'settings.paletteMidnight',
  sunset: 'settings.paletteSunset',
  lavender: 'settings.paletteLavender',
} as const;

/** Palette swatches with a live mini preview, mode, and language. */
export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, palette, mode, resolved, setPalette, setMode } = useTheme();
  const { locale, setLocale } = useLocale();
  const t = useT();

  const modeOptions = useMemo<Segment<ThemeMode>[]>(
    () => [
      { id: 'system', label: t('settings.system'), Icon: Smartphone },
      { id: 'light', label: t('settings.light'), Icon: Sun },
      { id: 'dark', label: t('settings.dark'), Icon: Moon },
    ],
    [t],
  );
  const langOptions = useMemo<Segment<Locale>[]>(
    () => [
      { id: 'en', label: t('settings.english') },
      { id: 'id', label: t('settings.indonesian') },
    ],
    [t],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        label: { fontSize: fontSize.xs, fontWeight: weight.heavy, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: spacing.xs, marginBottom: spacing.sm },
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
        swatch: {
          width: '47.5%',
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: colors.border,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        },
        swatchActive: { borderColor: colors.primary },
        preview: { height: 84, padding: spacing.sm, gap: 6 },
        previewCard: { flex: 1, borderRadius: radius.sm, padding: 6, gap: 4, justifyContent: 'center' },
        previewLine: { height: 6, borderRadius: 3, width: '55%' },
        previewRow: { flexDirection: 'row', gap: 4 },
        previewPill: { height: 10, borderRadius: 5, flex: 1 },
        swatchFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 44 },
        swatchName: { fontSize: fontSize.sm, fontWeight: weight.bold, color: colors.textPrimary },
        hint: { fontSize: fontSize.xs, color: colors.textMuted, paddingHorizontal: spacing.xs, marginTop: spacing.sm },
      }),
    [colors, insets.bottom],
  );

  const renderSwatch = (id: PaletteId) => {
    const p = PALETTES[id];
    const c = resolved === 'dark' ? p.dark : p.light;
    const active = id === palette;
    return (
      <Pressable
        key={id}
        style={[styles.swatch, active && styles.swatchActive]}
        onPress={() => {
          hapticSelection();
          setPalette(id);
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={t(PALETTE_NAME_KEYS[id])}
      >
        <View style={[styles.preview, { backgroundColor: c.bg }]}>
          <View style={[styles.previewCard, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }]}>
            <View style={[styles.previewLine, { backgroundColor: c.textPrimary }]} />
            <View style={[styles.previewLine, { backgroundColor: c.textMuted, width: '35%' }]} />
            <View style={styles.previewRow}>
              <View style={[styles.previewPill, { backgroundColor: c.primary }]} />
              <View style={[styles.previewPill, { backgroundColor: c.income }]} />
              <View style={[styles.previewPill, { backgroundColor: c.expense }]} />
            </View>
          </View>
        </View>
        <View style={styles.swatchFoot}>
          <Text style={styles.swatchName}>{t(PALETTE_NAME_KEYS[id])}</Text>
          {active ? <Check size={18} color={colors.primary} /> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <TopBar title={t('settings.appearance')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.label}>{t('settings.mode')}</Text>
          <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
        </View>

        <View>
          <Text style={styles.label}>{t('settings.palette')}</Text>
          <View style={styles.grid}>{PALETTE_IDS.map(renderSwatch)}</View>
          <Text style={styles.hint}>{t('settings.paletteHint')}</Text>
        </View>

        <View>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <SegmentedControl options={langOptions} value={locale} onChange={setLocale} />
        </View>
      </ScrollView>
    </Screen>
  );
}
