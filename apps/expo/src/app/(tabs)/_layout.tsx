import { Text } from "react-native";
import { Tabs } from "expo-router";

import { colors } from "~/styles/tokens";

// Simple text icon helper — v1 placeholder until an icon library is configured
function TabIcon({ label, active }: { label: string; active: boolean }) {
  return (
    <Text
      style={{
        fontSize: 20,
        color: active ? colors.brick.DEFAULT : colors.fg.inkMuted,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.bg.creamSoft },
        tabBarActiveTintColor: colors.brick.DEFAULT,
        tabBarInactiveTintColor: colors.fg.inkMuted,
        headerStyle: { backgroundColor: colors.bg.creamSoft },
        headerTintColor: colors.fg.ink,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⌂" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="greenways"
        options={{
          title: "Greenways",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="🌿" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: "Deals",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="%" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: "Parking",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="P" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="◎" active={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
