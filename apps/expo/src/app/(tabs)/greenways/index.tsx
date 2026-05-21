import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { ListSkeleton } from "~/components/list-skeleton";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { colors, space, type } from "~/styles/tokens";

export default function GreenwaysListScreen() {
  const { data, isPending, isError, refetch } = useQuery(
    trpc.greenway.list.queryOptions(),
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
          message="Could not load greenways."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}>
        <EmptyState message="No greenways yet. The data layer is still warming up. Check back in a moment." />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ padding: space[4] }}
      data={data}
      keyExtractor={(g) => g.slug}
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: colors.border.soft }} />
      )}
      renderItem={({ item }) => (
        <Link href={`/greenways/${item.slug}`} asChild>
          <Pressable
            style={{ paddingVertical: space[4] }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name} greenway`}
          >
            <Text style={{ ...type.headingMd, color: colors.fg.ink }}>{item.name}</Text>
            <Text
              style={{
                ...type.bodySm,
                color: colors.fg.inkMuted,
                marginTop: space[1],
              }}
            >
              {item.lengthMiles.toFixed(1)} mi · {item.surface}
            </Text>
          </Pressable>
        </Link>
      )}
      ListHeaderComponent={
        <View style={{ marginBottom: space[4] }}>
          <Text style={{ ...type.displayLg, color: colors.fg.ink }}>
            Charlotte Greenways
          </Text>
          <Text
            style={{
              ...type.bodySm,
              color: colors.fg.inkMuted,
              marginTop: space[1],
            }}
          >
            {data.length} {data.length === 1 ? "trail" : "trails"}
          </Text>
        </View>
      }
    />
  );
}
