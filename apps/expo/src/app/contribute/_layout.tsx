import { Stack } from "expo-router";

import { colors } from "~/styles/tokens";

export default function ContributeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.creamSoft },
        headerTintColor: colors.fg.ink,
        headerBackTitle: "Back",
        headerTitle: "Contribute",
      }}
    />
  );
}
