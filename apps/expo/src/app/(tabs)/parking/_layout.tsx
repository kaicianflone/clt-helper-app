import { Stack } from "expo-router";

import { colors } from "~/styles/tokens";

export default function ParkingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.creamSoft },
        headerTintColor: colors.fg.ink,
        headerBackTitle: "Parking",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Parking" }} />
      <Stack.Screen name="[slug]" options={{ title: "" }} />
    </Stack>
  );
}
