import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/** Bottom navigation — max 5 tabs, persistent (Component Library rule). */
export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: t.colors.tabBar,
          borderTopColor: t.colors.tabBarBorder,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tr('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: tr('tabs.discover'),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: tr('tabs.planner'),
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: tr('tabs.albums'),
          tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tr('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
