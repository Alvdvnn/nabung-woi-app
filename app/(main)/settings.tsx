import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Database, Info, Lock, Palette, PiggyBank, Plus, SlidersHorizontal, Tag, Wallet } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import Fab from '../../components/ui/Fab';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import { contentBottomForFab, fabBottomForTabScreen } from '../../constants/layout';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useData } from '../../context/DataContext';
import { useCategories } from '../../context/CategoriesContext';
import { usePrefs } from '../../context/PrefsContext';
import { usePin } from '../../context/PinContext';
import { useT } from '../../i18n';
import { APP_VERSION } from '../../constants/version';

/** Root of Settings: a grouped list; every row opens its own screen. */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  const { accounts } = useData();
  const { customCats } = useCategories();
  const { budgets } = usePrefs();
  const pin = usePin();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: contentBottomForFab(insets.bottom) },
      }),
    [insets.bottom],
  );

  return (
    <Screen>
      <TopBar title={t('settings.title')} showLogo={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionGroup title={t('settings.groupMoney')}>
          <ListRow
            Icon={Wallet}
            title={t('settings.accounts')}
            subtitle={t('settings.accountsSub', { n: accounts.length })}
            trailing="chevron"
            onPress={() => router.push('/settings/accounts')}
          />
          <ListRow
            Icon={Tag}
            title={t('settings.categories')}
            subtitle={t('settings.categoriesSub', { n: customCats.length })}
            trailing="chevron"
            onPress={() => router.push('/settings/categories')}
          />
          <ListRow
            Icon={PiggyBank}
            title={t('settings.budgets')}
            subtitle={budgets.length > 0 ? t('settings.budgetsSub', { n: budgets.length }) : t('settings.budgetsNone')}
            trailing="chevron"
            onPress={() => router.push('/settings/budgets')}
          />
        </SectionGroup>

        <SectionGroup title={t('settings.groupApp')}>
          <ListRow
            Icon={Palette}
            title={t('settings.appearance')}
            subtitle={t('settings.appearanceSub')}
            trailing="chevron"
            onPress={() => router.push('/settings/appearance')}
          />
          <ListRow
            Icon={SlidersHorizontal}
            title={t('settings.preferences')}
            subtitle={t('settings.preferencesSub')}
            trailing="chevron"
            onPress={() => router.push('/settings/preferences')}
          />
          <ListRow
            Icon={Lock}
            title={t('settings.security')}
            subtitle={pin.enabled ? t('pin.enabled') : t('pin.disabled')}
            iconTint={pin.enabled ? colors.income : undefined}
            iconBg={pin.enabled ? colors.incomeLight : undefined}
            trailing="chevron"
            onPress={() => router.push('/settings/security')}
          />
        </SectionGroup>

        <SectionGroup title={t('settings.groupData')}>
          <ListRow
            Icon={Database}
            title={t('settings.data')}
            subtitle={t('settings.dataSub')}
            trailing="chevron"
            onPress={() => router.push('/settings/data')}
          />
          <ListRow
            Icon={Info}
            title={t('settings.about')}
            subtitle={`Nabung Woi ${APP_VERSION}`}
            trailing="chevron"
            onPress={() => router.push('/settings/about')}
          />
        </SectionGroup>
        <View />
      </ScrollView>

      <Fab Icon={Plus} bottom={fabBottomForTabScreen(insets.bottom)} onPress={() => router.push('/')} accessibilityLabel={t('input.headingAdd')} />
    </Screen>
  );
}
