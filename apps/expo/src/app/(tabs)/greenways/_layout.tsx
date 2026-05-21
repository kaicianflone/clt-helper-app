import { Stack } from "expo-router";

import { colors } from "~/styles/tokens";

export default function GreenwaysLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.creamSoft },
        headerTintColor: colors.fg.ink,
        headerBackTitle: "Greenways",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Greenways" }} />
      <Stack.Screen name="[slug]" options={{ title: "" }} />
    </Stack>
  );
}
