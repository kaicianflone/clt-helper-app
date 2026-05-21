import { Text, View } from "react-native";

import { colors, space, type } from "~/styles/tokens";

export default function MapScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.cream,
        alignItems: "center",
        justifyContent: "center",
        padding: space[4],
      }}
    >
      <Text style={{ ...type.displayMd, color: colors.fg.ink }}>Map</Text>
      <Text
        style={{
          ...type.bodyMd,
          color: colors.fg.inkMuted,
          marginTop: space[2],
          textAlign: "center",
        }}
      >
        Interactive map coming in C2.
      </Text>
    </View>
  );
}
