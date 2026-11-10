import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, EyeOff, Vibrate, Wallet } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import Switch from '../../components/ui/Switch';
import SegmentedControl, { Segment } from '../../components/ui/SegmentedControl';
import AccountPickerSheet from '../../components/account/AccountPickerSheet';
import { spacing } from '../../constants/theme';
import { useData } from '../../context/DataContext';
import { usePrefs } from '../../context/PrefsContext';
import { WeekStart, getBalanceHidden, setBalanceHidden } from '../../utils/storage';
import { useT } from '../../i18n';

export default function PreferencesSettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const { accounts, accountsById } = useData();
  const { prefs, updatePrefs } = usePrefs();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    getBalanceHidden().then(setHidden);
  }, []);

  const weekOptions = useMemo<Segment<WeekStart>[]>(
    () => [
      { id: 'mon', label: t('settings.weekStartMon') },
      { id: 'sun', label: t('settings.weekStartSun') },
    ],
    [t],
  );

  const styles = useMemo(
    () => StyleSheet.create({ content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl } }),
    [insets.bottom],
  );

  const defaultAccount = prefs.defaultAccountId ? accountsById.get(prefs.defaultAccountId) : undefined;

  return (
    <Screen>
      <TopBar title={t('settings.preferences')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionGroup title={t('settings.groupEntry')} footer={t('settings.defaultAccountHint')}>
          <ListRow
            Icon={Wallet}
            title={t('settings.defaultAccount')}
            value={defaultAccount?.name ?? t('settings.defaultAccountNone')}
            trailing="chevron"
            onPress={() => setPickerOpen(true)}
          />
        </SectionGroup>

        <SectionGroup title={t('settings.weekStart')}>
          <View style={{ padding: spacing.md }}>
            <SegmentedControl options={weekOptions} value={prefs.weekStart} onChange={(w) => updatePrefs({ weekStart: w })} />
          </View>
          <ListRow Icon={CalendarDays} title={t('settings.weekStartHint')} />
        </SectionGroup>

        <SectionGroup title={t('settings.groupDisplay')}>
          <ListRow
            Icon={EyeOff}
            title={t('settings.hideBalanceDefault')}
            subtitle={t('settings.hideBalanceDefaultSub')}
            trailing={
              <Switch
                value={hidden}
                onValueChange={(v) => {
                  setHidden(v);
                  setBalanceHidden(v);
                }}
                accessibilityLabel={t('settings.hideBalanceDefault')}
              />
            }
          />
          <ListRow
            Icon={Vibrate}
            title={t('settings.hapticsLabel')}
            subtitle={t('settings.hapticsSub')}
            trailing={<Switch value={prefs.haptics} onValueChange={(v) => updatePrefs({ haptics: v })} accessibilityLabel={t('settings.hapticsLabel')} />}
          />
        </SectionGroup>
      </ScrollView>

      <AccountPickerSheet
        visible={pickerOpen}
        accounts={accounts}
        selectedId={prefs.defaultAccountId ?? null}
        onSelect={(id) => updatePrefs({ defaultAccountId: id })}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}
