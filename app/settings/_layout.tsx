import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

/** Settings sub-pages: full-height stack screens pushed over the tab bar. */
export default function SettingsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
