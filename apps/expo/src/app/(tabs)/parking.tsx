import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { ListSkeleton } from "~/components/list-skeleton";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { colors, space, type } from "~/styles/tokens";

export default function ParkingScreen() {
  const { data, isPending, isError, refetch } = useQuery(
    trpc.parking.list.queryOptions(),
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
        Parking
      </Text>

      {isPending ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState
          message="Could not load parking."
          onRetry={() => void refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState message="No parking locations found." />
      ) : (
        <View>
          {data.map((lot) => (
            <Link
              key={lot.slug}
              href={`/parking/${lot.slug}`}
              style={{
                paddingVertical: space[3],
                borderBottomWidth: 1,
                borderBottomColor: colors.border.soft,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.bodyLg, color: colors.fg.ink }}>
                {lot.name}
              </Text>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
