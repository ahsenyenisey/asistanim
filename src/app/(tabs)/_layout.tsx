import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.card },
        headerTitleStyle: { color: t.text, fontWeight: '700' },
        headerTintColor: t.primary,
        headerShadowVisible: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textSecondary,
        tabBarStyle: { backgroundColor: t.tabBar, borderTopColor: t.border },
        sceneStyle: { backgroundColor: t.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Bugün', tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="notlar"
        options={{ title: 'Notlar', tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="hatirlatmalar"
        options={{ title: 'Hatırlatmalar', tabBarIcon: ({ color, size }) => <Ionicons name="alarm-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="surecler"
        options={{ title: 'Süreçler', tabBarIcon: ({ color, size }) => <Ionicons name="git-branch-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="asistan"
        options={{ title: 'Asistan', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
