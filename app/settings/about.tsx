import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Code2, ShieldCheck, Sparkles } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import Logo from '../../components/brand/Logo';
import WhatsNewSheet from '../../components/feedback/WhatsNewSheet';
import { fontSize, spacing, weight } from '../../constants/theme';
import { APP_VERSION } from '../../constants/version';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';

export default function AboutSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const [whatsNew, setWhatsNew] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
        name: { fontSize: fontSize.xxl, fontWeight: weight.black, color: colors.textPrimary, letterSpacing: -0.5 },
        version: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: weight.semibold },
        tagline: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
      }),
    [colors, insets.bottom],
  );

  return (
    <Screen>
      <TopBar title={t('settings.about')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Logo size={96} />
          <Text style={styles.name}>Nabung Woi</Text>
          <Text style={styles.version}>{t('settings.version', { v: APP_VERSION })}</Text>
          <Text style={styles.tagline}>{t('settings.tagline')}</Text>
        </View>

        <SectionGroup>
          <ListRow Icon={Sparkles} title={t('settings.whatsNew')} subtitle={t('settings.whatsNewSub')} trailing="chevron" onPress={() => setWhatsNew(true)} />
          <ListRow Icon={ShieldCheck} title={t('settings.privacy')} subtitle={t('settings.privacySub')} />
          <ListRow Icon={Code2} title={t('settings.openSource')} subtitle={t('settings.openSourceSub')} />
        </SectionGroup>
      </ScrollView>

      <WhatsNewSheet visible={whatsNew} onClose={() => setWhatsNew(false)} />
    </Screen>
  );
}
