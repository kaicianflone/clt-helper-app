import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

import { colors, space, type } from "~/styles/tokens";
import { trpc } from "~/utils/api";

const ONBOARDING_KEY = "clt-onboarding-seen";

const slotForHour = (h: number) =>
  h < 11 ? "trails" : h < 16 ? "deals" : "parking";

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    void AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) router.replace("/onboarding");
    });
  }, [router]);

  const greenways = useQuery(trpc.greenway.list.queryOptions());
  const deals = useQuery(trpc.deal.list.queryOptions({}));
  const parking = useQuery(trpc.parking.list.queryOptions());

  const now = new Date();
  const slot = slotForHour(now.getHours());
  const dayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const items =
    slot === "trails"
      ? (greenways.data?.slice(0, 5) ?? [])
      : slot === "deals"
        ? (deals.data?.slice(0, 5) ?? [])
        : (parking.data?.slice(0, 5) ?? []);

  const sectionLabel =
    slot === "trails"
      ? "Greenways"
      : slot === "deals"
        ? "Deals today"
        : "Parking";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ padding: space[4] }}
    >
      <Text style={{ ...type.displayLg, color: colors.fg.ink }}>
        Today in Charlotte
      </Text>
      <Text
        style={{
          ...type.bodySm,
          color: colors.fg.inkMuted,
          marginTop: space[1],
        }}
      >
        {dayLabel}
      </Text>

      <Text
        style={{
          ...type.headingLg,
          color: colors.fg.ink,
          marginTop: space[8],
        }}
      >
        {sectionLabel}
      </Text>

      <View style={{ marginTop: space[3] }}>
        {items.map(
          (item: { slug: string; name?: string; restaurantName?: string }) => (
            <Link
              key={item.slug}
              href={
                slot === "trails"
                  ? `/greenways/${item.slug}`
                  : slot === "deals"
                    ? `/deals`
                    : `/parking/${item.slug}`
              }
              style={{
                paddingVertical: space[3],
                borderBottomWidth: 1,
                borderBottomColor: colors.border.soft,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.bodyLg, color: colors.fg.ink }}>
                {item.name ?? item.restaurantName}
              </Text>
            </Link>
          ),
        )}
      </View>
    </ScrollView>
  );
}
