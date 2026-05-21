import { Text } from "react-native";

import { colors, type } from "~/styles/tokens";

interface LastVerifiedBadgeProps {
  date: string;
  now: number;
}

export function LastVerifiedBadge({ date, now }: LastVerifiedBadgeProps) {
  const days = Math.floor((now - new Date(date).getTime()) / 86_400_000);

  const color =
    days <= 30 ? colors.green : days <= 90 ? colors.amber : colors.rose;

  const bgColor =
    days <= 30
      ? colors.green + "1A"
      : days <= 90
        ? colors.amber + "1A"
        : colors.rose + "1A";

  const label =
    days === 0
      ? "Verified today"
      : days === 1
        ? "Verified yesterday"
        : days < 30
          ? `Verified ${days} days ago`
          : days < 60
            ? `Verified ${Math.floor(days / 7)} weeks ago`
            : `Verified ${Math.floor(days / 30)} months ago`;

  return (
    <Text
      style={{
        ...type.bodyXs,
        color,
        backgroundColor: bgColor,
        borderRadius: 9999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        overflow: "hidden",
        textTransform: "uppercase",
        alignSelf: "flex-start",
      }}
    >
      {label}
    </Text>
  );
}
