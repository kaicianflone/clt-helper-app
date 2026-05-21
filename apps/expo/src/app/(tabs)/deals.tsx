import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { DayPills } from "~/components/day-pills";
import { ListSkeleton } from "~/components/list-skeleton";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { colors, space, type } from "~/styles/tokens";

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

export default function DealsScreen() {
  const todayKey = DAY_MAP[new Date().getDay()] ?? "mon";
  const [selectedDay, setSelectedDay] = useState<DayKey>(todayKey);

  const { data, isPending, isError, refetch } = useQuery(
    trpc.deal.list.queryOptions({ day: selectedDay }),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ padding: space[4] }}
    >
      <Text
        style={{
          ...type.displayMd,
          color: colors.fg.ink,
          marginBottom: space[4],
        }}
      >
        Deals
      </Text>

      <DayPills
        selected={selectedDay}
        onSelect={(d) => setSelectedDay(d as DayKey)}
      />

      <View style={{ marginTop: space[4] }}>
        {isPending ? (
          <ListSkeleton rows={6} />
        ) : isError ? (
          <ErrorState
            message="Could not load deals."
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState message={`No deals on ${selectedDay}.`} />
        ) : (
          <View>
            {data.map((deal) => (
              <View
                key={deal.slug}
                style={{
                  paddingVertical: space[3],
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.soft,
                }}
              >
                <Text style={{ ...type.bodyLg, color: colors.fg.ink }}>
                  {deal.restaurantName}
                </Text>
                <Text style={{ ...type.bodySm, color: colors.fg.inkMuted }}>
                  {deal.dealDescription}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
