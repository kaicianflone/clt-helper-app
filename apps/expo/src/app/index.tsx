import { Redirect } from "expo-router";

// Root index — redirect to the tabs navigator
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
