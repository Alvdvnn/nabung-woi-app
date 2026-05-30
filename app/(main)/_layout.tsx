import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, CalendarDays, Settings, History, Dices } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';

export default function MainLayout() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.bg },
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
          // On web/PWA, add safe-area-inset-bottom so the tab bar clears
          // the iPhone home indicator when installed as a PWA.
          ...(Platform.OS === 'web' && {
            height: 'auto' as any,
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' as any,
          }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('tabs.dashboard'), tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: t('tabs.calendar'), tabBarIcon: ({ color, size }) => <CalendarDays size={size - 2} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history'), tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} /> }} />
      <Tabs.Screen name="gacha" options={{ title: t('tabs.gacha'), tabBarIcon: ({ color, size }) => <Dices size={size - 2} color={color} /> }} />
    </Tabs>
  );
}
