import { Pressable, Share, Text } from "react-native";

import { colors, radius, space, type } from "~/styles/tokens";

interface ShareButtonProps {
  url: string;
  title: string;
  message?: string;
  label?: string;
}

export function ShareButton({
  url,
  title,
  message,
  label = "Share",
}: ShareButtonProps) {
  const handleShare = async () => {
    await Share.share({ url, title, message: message ?? title });
  };

  return (
    <Pressable
      onPress={() => void handleShare()}
      style={({ pressed }) => ({
        paddingHorizontal: space[4],
        paddingVertical: space[2],
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border.soft,
        backgroundColor: pressed ? colors.bg.creamDeep : colors.bg.creamSoft,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
      })}
      accessibilityRole="button"
      accessibilityLabel={`Share ${title}`}
    >
      <Text style={{ ...type.bodyMd, color: colors.fg.ink }}>{label}</Text>
    </Pressable>
  );
}
