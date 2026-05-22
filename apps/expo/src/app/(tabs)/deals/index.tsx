import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { DayPills } from "~/components/day-pills";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { LastVerifiedBadge } from "~/components/last-verified-badge";
import { ListSkeleton } from "~/components/list-skeleton";
import { colors, space, type } from "~/styles/tokens";
import { trpc } from "~/utils/api";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAY_MAP: Record<number, DayKey> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function formatTimeWindow(
  tw: { start: string; end: string } | "all-day",
): string {
  if (tw === "all-day") return "All day";
  return `${tw.start} – ${tw.end}`;
}

export default function DealsListScreen() {
  const [now] = useState(() => Date.now());
  const todayKey = DAY_MAP[new Date().getDay()] ?? "mon";
  const [selectedDay, setSelectedDay] = useState<DayKey>(todayKey);

  const { data, isPending, isError, refetch } = useQuery(
    trpc.deal.list.queryOptions({ day: selectedDay }),
  );

  const ListHeader = (
    <View style={{ marginBottom: space[4] }}>
      <Text style={{ ...type.displayLg, color: colors.fg.ink }}>
        Charlotte Deals
      </Text>
      <Text
        style={{
          ...type.bodySm,
          color: colors.fg.inkMuted,
          marginTop: space[1],
          marginBottom: space[4],
        }}
      >
        Happy hours & specials by day
      </Text>
      <DayPills
        selected={selectedDay}
        onSelect={(d) => setSelectedDay(d as DayKey)}
      />
    </View>
  );

  if (isPending) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}
      >
        {ListHeader}
        <ListSkeleton rows={5} />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}
      >
        {ListHeader}
        <ErrorState
          message="Could not load deals."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}
      >
        {ListHeader}
        <EmptyState message={`No deals on ${selectedDay}.`} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ padding: space[4] }}
      data={data}
      keyExtractor={(d) => d.slug}
      ListHeaderComponent={ListHeader}
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: colors.border.soft }} />
      )}
      renderItem={({ item }) => (
        <Link href={`/contribute/deal/${item.slug}`} asChild>
          <Pressable
            style={{ paddingVertical: space[4] }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${item.restaurantName}: ${item.dealDescription}`}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text
                style={{
                  ...type.headingMd,
                  color: colors.fg.ink,
                  flex: 1,
                  marginRight: space[2],
                }}
              >
                {item.restaurantName}
              </Text>
              <LastVerifiedBadge date={item.lastVerified} now={now} />
            </View>
            <Text
              style={{
                ...type.bodyMd,
                color: colors.fg.inkSoft,
                marginTop: space[1],
              }}
            >
              {item.dealDescription}
            </Text>
            <Text
              style={{
                ...type.bodySm,
                color: colors.fg.inkMuted,
                marginTop: space[1],
              }}
            >
              {formatTimeWindow(item.timeWindow)} · {item.restaurantAddress}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
