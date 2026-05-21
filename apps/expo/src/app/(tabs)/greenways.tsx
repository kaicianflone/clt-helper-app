import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { ListSkeleton } from "~/components/list-skeleton";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { colors, space, type } from "~/styles/tokens";

export default function GreenwaysScreen() {
  const { data, isPending, isError, refetch } = useQuery(
    trpc.greenway.list.queryOptions(),
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
        Greenways
      </Text>

      {isPending ? (
        <ListSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          message="Could not load greenways."
          onRetry={() => void refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState message="No greenways found." />
      ) : (
        <View>
          {data.map((g) => (
            <Link
              key={g.slug}
              href={`/greenways/${g.slug}`}
              style={{
                paddingVertical: space[3],
                borderBottomWidth: 1,
                borderBottomColor: colors.border.soft,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.bodyLg, color: colors.fg.ink }}>
                {g.name}
              </Text>
              <Text style={{ ...type.bodySm, color: colors.fg.inkMuted }}>
                {g.lengthMiles} mi · {g.surface}
              </Text>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
