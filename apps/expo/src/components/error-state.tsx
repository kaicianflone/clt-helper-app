import { Pressable, Text, View } from "react-native";

import { colors, radius, space, type } from "~/styles/tokens";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: space[12],
        paddingHorizontal: space[6],
        backgroundColor: colors.rose + "0D",
        borderRadius: radius.md,
      }}
    >
      <Text
        style={{
          ...type.headingMd,
          color: colors.rose,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            marginTop: space[4],
            paddingHorizontal: space[4],
            paddingVertical: space[2],
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.rose,
            backgroundColor: pressed ? colors.rose + "1A" : "transparent",
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          })}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={{ ...type.bodyMd, color: colors.rose, fontFamily: "Inter_600SemiBold" }}>
            Try again
          </Text>
        </Pressable>
      )}
    </View>
  );
}
