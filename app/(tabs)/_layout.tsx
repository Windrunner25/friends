import { Tabs } from 'expo-router';
import React, { useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Palette } from '@/constants/theme';
import { LogModal } from '@/components/LogModal';

export default function TabLayout() {
  const [logVisible, setLogVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tabIconSelected,
          tabBarInactiveTintColor: Colors.light.tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: Palette.background,
            borderTopColor: Palette.tabBarBorder,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="people"
          options={{
            title: 'People',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
          }}
        />
        {/* Log tab intercepts navigation and shows the log dialogue directly */}
        <Tabs.Screen
          name="log"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setLogVisible(true);
            },
          }}
          options={{
            title: 'Log',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="square.and.pencil" color={color} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
          }}
        />
      </Tabs>

      {/* Log interaction dialogue — shown on Log tab tap, no intermediate screen */}
      <LogModal visible={logVisible} onClose={() => setLogVisible(false)} />
    </>
  );
}
