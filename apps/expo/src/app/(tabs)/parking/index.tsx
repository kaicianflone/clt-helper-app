import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { ListSkeleton } from "~/components/list-skeleton";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { colors, space, type } from "~/styles/tokens";

function formatRate(hourlyRate: number | null): string {
  if (hourlyRate === null) return "Free";
  return `$${hourlyRate.toFixed(2)}/hr`;
}

export default function ParkingListScreen() {
  const { data, isPending, isError, refetch } = useQuery(
    trpc.parking.list.queryOptions(),
  );

  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}>
        <ListSkeleton rows={6} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}>
        <ErrorState
          message="Could not load parking."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}>
        <EmptyState message="No parking locations found." />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ padding: space[4] }}
      data={data}
      keyExtractor={(lot) => lot.slug}
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: colors.border.soft }} />
      )}
      renderItem={({ item }) => (
        <Link href={`/parking/${item.slug}`} asChild>
          <Pressable
            style={{ paddingVertical: space[4] }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name} parking lot`}
          >
            <Text style={{ ...type.headingMd, color: colors.fg.ink }}>
              {item.name}
            </Text>
            <Text
              style={{
                ...type.bodySm,
                color: colors.fg.inkMuted,
                marginTop: space[1],
              }}
            >
              {formatRate(item.hourlyRate)}
              {item.dailyMax !== null ? ` · $${item.dailyMax.toFixed(0)} max` : ""}
              {item.covered ? " · Covered" : ""}
            </Text>
            <Text
              style={{
                ...type.bodyXs,
                color: colors.fg.inkMuted,
                marginTop: space[1],
                textTransform: "uppercase",
              }}
            >
              {item.address}
            </Text>
          </Pressable>
        </Link>
      )}
      ListHeaderComponent={
        <View style={{ marginBottom: space[4] }}>
          <Text style={{ ...type.displayLg, color: colors.fg.ink }}>
            Charlotte Parking
          </Text>
          <Text
            style={{
              ...type.bodySm,
              color: colors.fg.inkMuted,
              marginTop: space[1],
            }}
          >
            {data.length} {data.length === 1 ? "location" : "locations"}
          </Text>
        </View>
      }
    />
  );
}
