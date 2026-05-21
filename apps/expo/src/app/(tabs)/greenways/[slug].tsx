import { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { LastVerifiedBadge } from "~/components/last-verified-badge";
import { StaleDataPrompt } from "~/components/stale-data-prompt";
import { ShareButton } from "~/components/share-button";
import { ErrorState } from "~/components/error-state";
import { colors, radius, space, type } from "~/styles/tokens";

const openInMaps = (lat: number, lng: number, label?: string) => {
  const url = Platform.select({
    ios: `maps://maps.apple.com/?q=${encodeURIComponent(label ?? "")}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label ?? "")})`,
    default: `https://www.google.com/maps?q=${lat},${lng}`,
  });
  if (url) {
    Linking.openURL(url).catch(() => {
      /* user dismissed */
    });
  }
};

export default function GreenwayDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [now] = useState(() => Date.now());

  const { data: greenway, isPending, isError, refetch } = useQuery(
    trpc.greenway.get.queryOptions({ slug }),
  );

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.cream,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ ...type.bodySm, color: colors.fg.inkMuted }}>Loading…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}>
        <ErrorState
          message="Could not load greenway."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }


  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ paddingBottom: space[16] }}
    >
      {/* Hero band */}
      <View
        style={{
          backgroundColor: colors.brick.DEFAULT,
          padding: space[6],
          paddingTop: space[8],
        }}
      >
        <Text style={{ ...type.displayLg, color: colors.bg.creamSoft }}>
          {greenway.name}
        </Text>
        <Text
          style={{
            ...type.bodyMd,
            color: colors.brick.soft,
            marginTop: space[2],
          }}
        >
          {greenway.lengthMiles.toFixed(1)} mi · {greenway.surface}
          {greenway.pointsOfInterest.length > 0
            ? ` · ${greenway.pointsOfInterest.length} POI${greenway.pointsOfInterest.length !== 1 ? "s" : ""}`
            : ""}
        </Text>
        <View style={{ marginTop: space[3] }}>
          <LastVerifiedBadge date={greenway.lastVerified} now={now} />
        </View>
      </View>

      <View style={{ padding: space[4] }}>
        {/* Description */}
        {greenway.description ? (
          <View style={{ marginBottom: space[6] }}>
            <Text
              style={{
                ...type.headingMd,
                color: colors.fg.ink,
                marginBottom: space[2],
              }}
            >
              About
            </Text>
            <Text style={{ ...type.bodyMd, color: colors.fg.inkSoft, lineHeight: 26 }}>
              {greenway.description}
            </Text>
          </View>
        ) : null}

        {/* Trailheads */}
        {greenway.trailheads.length > 0 ? (
          <View style={{ marginBottom: space[6] }}>
            <Text
              style={{
                ...type.headingMd,
                color: colors.fg.ink,
                marginBottom: space[2],
              }}
            >
              Trailheads
            </Text>
            {greenway.trailheads.map((th, i) => (
              <Pressable
                key={i}
                onPress={() => openInMaps(th.lat, th.lng, th.name)}
                hitSlop={8}
                style={({ pressed }) => ({
                  paddingVertical: space[3],
                  paddingHorizontal: space[3],
                  borderRadius: radius.md,
                  backgroundColor: pressed ? colors.bg.creamDeep : colors.bg.creamSoft,
                  borderWidth: 1,
                  borderColor: colors.border.soft,
                  marginBottom: space[2],
                  minHeight: 44,
                  justifyContent: "center",
                })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${th.name} in Maps`}
              >
                <Text style={{ ...type.bodyMd, color: colors.brick.DEFAULT }}>
                  {th.name}
                </Text>
                {th.parkingNotes ? (
                  <Text
                    style={{
                      ...type.bodySm,
                      color: colors.fg.inkMuted,
                      marginTop: space[1],
                    }}
                  >
                    {th.parkingNotes}
                  </Text>
                ) : null}
                <Text
                  style={{
                    ...type.bodyXs,
                    color: colors.fg.inkMuted,
                    marginTop: space[1],
                  }}
                >
                  Tap to open in Maps
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Points of Interest */}
        {greenway.pointsOfInterest.length > 0 ? (
          <View style={{ marginBottom: space[6] }}>
            <Text
              style={{
                ...type.headingMd,
                color: colors.fg.ink,
                marginBottom: space[2],
              }}
            >
              Points of Interest
            </Text>
            {greenway.pointsOfInterest.map((poi, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: space[2],
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.soft,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...type.bodyMd, color: colors.fg.ink }}>
                    {poi.name}
                  </Text>
                  <Text
                    style={{
                      ...type.bodySm,
                      color: colors.fg.inkMuted,
                      marginTop: space[1],
                      textTransform: "capitalize",
                    }}
                  >
                    {poi.kind}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Stale data prompt */}
        <StaleDataPrompt
          date={greenway.lastVerified}
          slug={greenway.slug}
          kind="greenway"
          now={now}
        />

        {/* CTAs */}
        <View
          style={{
            flexDirection: "row",
            gap: space[3],
            marginTop: space[4],
          }}
        >
          <Link href={`/contribute/greenway/${greenway.slug}`} asChild>
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? colors.brick.deep : colors.brick.DEFAULT,
                borderRadius: radius.md,
                paddingVertical: space[3],
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              })}
              accessibilityRole="button"
              accessibilityLabel="Suggest an edit"
            >
              <Text
                style={{
                  ...type.bodyMd,
                  color: colors.bg.creamSoft,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Suggest edit
              </Text>
            </Pressable>
          </Link>
          <ShareButton
            url={`https://charlottegreenways.app/greenways/${greenway.slug}`}
            title={greenway.name}
          />
        </View>
      </View>
    </ScrollView>
  );
}
