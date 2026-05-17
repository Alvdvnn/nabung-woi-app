import { Tabs } from 'expo-router';
import { LayoutDashboard, CalendarDays, Settings, History, Dices } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <CalendarDays size={size - 2} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} /> }} />
      <Tabs.Screen name="gacha" options={{ title: 'Gacha', tabBarIcon: ({ color, size }) => <Dices size={size - 2} color={color} /> }} />
    </Tabs>
  );
}
