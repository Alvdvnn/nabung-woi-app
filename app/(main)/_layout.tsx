import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  CalendarDays,
  ChartColumnBig,
  History,
  LayoutDashboard,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { fontSize, weight } from '../../constants/theme';
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
          backgroundColor: colors.surface,
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
        tabBarLabelStyle: { fontSize: fontSize.xs - 1, fontWeight: weight.semibold },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color, size }) => <CalendarDays size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: t('tabs.report'),
          tabBarIcon: ({ color, size }) => <ChartColumnBig size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
      {/*
        Gacha keeps its route (TopBar has a dice shortcut on every screen) but
        stays out of the tab bar: six tabs push each target under the 44pt
        minimum on a 375pt-wide phone and truncate the labels.
      */}
      <Tabs.Screen name="gacha" options={{ href: null, title: t('tabs.gacha') }} />
    </Tabs>
  );
}
