import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarRange, Calculator, LayoutDashboard, LucideIcon, Palette, PiggyBank, Lock, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import Logo from '../brand/Logo';
import { fontSize, spacing, weight } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ITEMS: { Icon: LucideIcon; title: 'wnThemes' | 'wnDashboard' | 'wnForm' | 'wnCalc' | 'wnBudgets' | 'wnPin' | 'wnSettings' | 'wnReport' }[] = [
  { Icon: Palette, title: 'wnThemes' },
  { Icon: LayoutDashboard, title: 'wnDashboard' },
  { Icon: Sparkles, title: 'wnForm' },
  { Icon: Calculator, title: 'wnCalc' },
  { Icon: PiggyBank, title: 'wnBudgets' },
  { Icon: CalendarRange, title: 'wnReport' },
  { Icon: Lock, title: 'wnPin' },
  { Icon: SlidersHorizontal, title: 'wnSettings' },
];

/** Short release notes for 2.0; shown once after upgrade and from About. */
export default function WhatsNewSheet({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        head: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
        title: { fontSize: fontSize.xl, fontWeight: weight.heavy, color: colors.textPrimary },
        sub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
        rowMain: { flex: 1, gap: 2 },
        rowTitle: { fontSize: fontSize.md, fontWeight: weight.bold, color: colors.textPrimary },
        rowBody: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 19 },
      }),
    [colors],
  );

  return (
    <Sheet visible={visible} onClose={onClose} scroll footer={<Button label={t('whatsNew.done')} onPress={onClose} size="lg" />}>
      <View style={styles.head}>
        <Logo size={64} />
        <Text style={styles.title} accessibilityRole="header">
          {t('whatsNew.title')}
        </Text>
        <Text style={styles.sub}>{t('whatsNew.sub')}</Text>
      </View>
      {ITEMS.map((item) => (
        <View key={item.title} style={styles.row}>
          <IconBadge Icon={item.Icon} size={40} />
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle}>{t(`whatsNew.${item.title}`)}</Text>
            <Text style={styles.rowBody}>{t(`whatsNew.${item.title}Body`)}</Text>
          </View>
        </View>
      ))}
    </Sheet>
  );
}
