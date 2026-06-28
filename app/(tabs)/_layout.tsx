import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Palette } from '@/constants/theme';
import { LogModal } from '@/components/LogModal';
import { PeopleProvider, usePeopleContext } from '@/contexts/people-context';

function TabLayoutInner() {
  const [logVisible, setLogVisible] = useState(false);
  const { people, error } = usePeopleContext();
  const [errorVisible, setErrorVisible] = useState(false);

  // Show a brief banner when the roster fails to load, then auto-dismiss.
  useEffect(() => {
    if (error) {
      setErrorVisible(true);
      const t = setTimeout(() => setErrorVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

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
      <LogModal visible={logVisible} people={people} onClose={() => setLogVisible(false)} />

      {/* Error banner — shown when roster fetch fails */}
      {errorVisible && (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorBannerText}>Could not load contacts. Check your connection.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#3A2020',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  errorBannerText: {
    color: '#FFD0D0',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default function TabLayout() {
  return (
    <PeopleProvider>
      <TabLayoutInner />
    </PeopleProvider>
  );
}
