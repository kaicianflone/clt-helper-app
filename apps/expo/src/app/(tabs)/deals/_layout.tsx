import { Stack } from "expo-router";

import { colors } from "~/styles/tokens";

export default function DealsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.creamSoft },
        headerTintColor: colors.fg.ink,
        headerBackTitle: "Deals",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Deals" }} />
    </Stack>
  );
}
