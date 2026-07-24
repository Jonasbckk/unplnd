import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/** Active tab = filled glyph, inactive = outline — tint alone is too subtle on the dark ground. */
function icon(active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

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
        // Android has no real medium weight for the system font — synthesizing one looks smeared.
        tabBarLabelStyle: {
          fontSize: 12,
          ...Platform.select({ ios: { fontWeight: '500' as const }, default: { fontFamily: 'Inter_500Medium' } }),
        },
      }}
      screenListeners={{
        // The most-touched control in the app deserves the same feedback as everything else.
        tabPress: () => haptics.selection(),
      }}
    >
      <Tabs.Screen name="index" options={{ title: tr('tabs.home'), tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen
        name="discover"
        options={{ title: tr('tabs.discover'), tabBarIcon: icon('compass', 'compass-outline') }}
      />
      <Tabs.Screen
        name="planner"
        options={{ title: tr('tabs.planner'), tabBarIcon: icon('sparkles', 'sparkles-outline') }}
      />
      <Tabs.Screen
        name="albums"
        options={{ title: tr('tabs.albums'), tabBarIcon: icon('images', 'images-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: tr('tabs.profile'), tabBarIcon: icon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
