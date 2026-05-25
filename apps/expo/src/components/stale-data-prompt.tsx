import { Text, View } from "react-native";
import { Link } from "expo-router";

import { colors, radius, space, type } from "~/styles/tokens";

interface StaleDataPromptProps {
  date: string;
  slug: string;
  kind: "greenway" | "deal" | "parking";
  now: number;
}

export function StaleDataPrompt({
  date,
  slug,
  kind,
  now,
}: StaleDataPromptProps) {
  const days = Math.floor((now - new Date(date).getTime()) / 86_400_000);

  if (days < 60) return null;

  const months = Math.floor(days / 30);

  return (
    <View
      style={{
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.amber + "4D",
        backgroundColor: colors.amber + "1A",
        padding: space[4],
        marginVertical: space[3],
      }}
    >
      <Text style={{ ...type.bodySm, color: colors.fg.inkSoft }}>
        This hasn&apos;t been verified in {months} month
        {months !== 1 ? "s" : ""}. Still accurate?
      </Text>
      <View
        style={{ flexDirection: "row", gap: space[4], marginTop: space[2] }}
      >
        <Link
          href={`/contribute/${kind}/${slug}?verify=yes`}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              ...type.bodySm,
              color: colors.brick.DEFAULT,
              fontFamily: "SourceSerif4_600SemiBold",
              textDecorationLine: "underline",
            }}
          >
            Yes, it&apos;s accurate
          </Text>
        </Link>
        <Link
          href={`/contribute/${kind}/${slug}`}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              ...type.bodySm,
              color: colors.fg.inkSoft,
              textDecorationLine: "underline",
            }}
          >
            Suggest an edit
          </Text>
        </Link>
      </View>
    </View>
  );
}
