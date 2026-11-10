import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timer } from 'lucide-react-native';
import Screen from '../../components/ui/Screen';
import TopBar from '../../components/ui/TopBar';
import ListRow from '../../components/ui/ListRow';
import SectionGroup from '../../components/ui/SectionGroup';
import PinManager from '../../components/security/PinManager';
import { spacing } from '../../constants/theme';
import { usePin } from '../../context/PinContext';
import { usePrefs } from '../../context/PrefsContext';
import { AutoLockSec } from '../../utils/storage';
import { useT } from '../../i18n';

const AUTO_LOCK: { value: AutoLockSec; key: 'autoLockNow' | 'autoLock30s' | 'autoLock1m' | 'autoLock5m' | 'autoLockNever' }[] = [
  { value: 0, key: 'autoLockNow' },
  { value: 30, key: 'autoLock30s' },
  { value: 60, key: 'autoLock1m' },
  { value: 300, key: 'autoLock5m' },
  { value: -1, key: 'autoLockNever' },
];

export default function SecuritySettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const pin = usePin();
  const { prefs, updatePrefs } = usePrefs();

  const styles = useMemo(
    () => StyleSheet.create({ content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xxl } }),
    [insets.bottom],
  );

  return (
    <Screen>
      <TopBar title={t('settings.security')} showBack showLogo={false} showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PinManager onChange={pin.refresh} />

        {pin.enabled ? (
          <SectionGroup title={t('settings.autoLock')} footer={t('settings.autoLockHint')}>
            {AUTO_LOCK.map((opt) => (
              <ListRow
                key={opt.value}
                Icon={Timer}
                title={t(`settings.${opt.key}`)}
                trailing="check"
                selected={prefs.autoLockSec === opt.value}
                onPress={() => updatePrefs({ autoLockSec: opt.value })}
              />
            ))}
          </SectionGroup>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
