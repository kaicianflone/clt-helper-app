import { Text, View } from "react-native";
import { Link } from "expo-router";

import { colors, space, type } from "~/styles/tokens";

interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ message, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: space[12],
        paddingHorizontal: space[6],
      }}
    >
      <Text
        style={{
          ...type.displayMd,
          color: colors.fg.inkMuted,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          style={{ marginTop: space[4], minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              ...type.bodyMd,
              color: colors.brick.DEFAULT,
              fontFamily: "Inter_600SemiBold",
              textDecorationLine: "underline",
            }}
          >
            {ctaLabel}
          </Text>
        </Link>
      )}
    </View>
  );
}
