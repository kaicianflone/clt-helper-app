import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "~/components/error-state";
import { LastVerifiedBadge } from "~/components/last-verified-badge";
import { ShareButton } from "~/components/share-button";
import { StaleDataPrompt } from "~/components/stale-data-prompt";
import { colors, radius, space, type } from "~/styles/tokens";
import { trpc } from "~/utils/api";

type DayHours = { open: string; close: string } | "closed" | "24h";

type HoursMap = Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  DayHours
>;

const DAY_LABELS: { key: keyof HoursMap; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function formatHours(hours: DayHours): string {
  if (hours === "closed") return "Closed";
  if (hours === "24h") return "Open 24h";
  return `${hours.open} – ${hours.close}`;
}

function formatRate(hourlyRate: number | null): string {
  if (hourlyRate === null) return "Free";
  return `$${hourlyRate.toFixed(2)}/hr`;
}

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

export default function ParkingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [now] = useState(() => Date.now());

  const {
    data: lot,
    isPending,
    isError,
    refetch,
  } = useQuery(trpc.parking.get.queryOptions({ slug }));

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
        <Text style={{ ...type.bodySm, color: colors.fg.inkMuted }}>
          Loading…
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg.cream, padding: space[4] }}
      >
        <ErrorState
          message="Could not load parking lot."
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  const hours = lot.hours as HoursMap;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg.cream }}
      contentContainerStyle={{ paddingBottom: space[16] }}
    >
      {/* Header */}
      <View style={{ padding: space[4], paddingTop: space[6] }}>
        <Text style={{ ...type.displayLg, color: colors.fg.ink }}>
          {lot.name}
        </Text>
        <Pressable
          onPress={() => openInMaps(lot.latLng[0], lot.latLng[1], lot.name)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Open ${lot.name} in Maps`}
        >
          <Text
            style={{
              ...type.bodySm,
              color: colors.brick.DEFAULT,
              marginTop: space[1],
              textDecorationLine: "underline",
            }}
          >
            {lot.address}
          </Text>
        </Pressable>
      </View>

      {/* Rate panel */}
      <View
        style={{
          marginHorizontal: space[4],
          backgroundColor: colors.bg.creamSoft,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border.soft,
          padding: space[4],
          marginBottom: space[4],
        }}
      >
        <Text
          style={{
            ...type.displayMd,
            color: colors.fg.ink,
            fontFamily: "BarlowCondensed_700Bold",
          }}
        >
          {formatRate(lot.hourlyRate)}
        </Text>
        <View style={{ marginTop: space[2], gap: space[1] }}>
          {lot.dailyMax !== null ? (
            <Text style={{ ...type.bodySm, color: colors.fg.inkSoft }}>
              Daily max: ${lot.dailyMax.toFixed(0)}
            </Text>
          ) : null}
          <Text style={{ ...type.bodySm, color: colors.fg.inkSoft }}>
            {lot.covered ? "Covered parking" : "Uncovered parking"}
          </Text>
          {lot.paymentMethods.length > 0 ? (
            <Text style={{ ...type.bodySm, color: colors.fg.inkSoft }}>
              Accepts: {lot.paymentMethods.join(", ")}
            </Text>
          ) : null}
          {lot.operator ? (
            <Text style={{ ...type.bodySm, color: colors.fg.inkSoft }}>
              Operator: {lot.operator}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Hours grid */}
      <View
        style={{
          marginHorizontal: space[4],
          marginBottom: space[4],
        }}
      >
        <Text
          style={{
            ...type.headingMd,
            color: colors.fg.ink,
            marginBottom: space[2],
          }}
        >
          Hours
        </Text>
        {DAY_LABELS.map(({ key, label }) => (
          <View
            key={key}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: space[2],
              borderBottomWidth: 1,
              borderBottomColor: colors.border.soft,
            }}
          >
            <Text style={{ ...type.bodyMd, color: colors.fg.ink }}>
              {label}
            </Text>
            <Text style={{ ...type.bodyMd, color: colors.fg.inkSoft }}>
              {formatHours(hours[key])}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: space[4] }}>
        {/* Last verified + stale prompt */}
        <View style={{ marginBottom: space[2] }}>
          <LastVerifiedBadge date={lot.lastVerified} now={now} />
        </View>

        <StaleDataPrompt
          date={lot.lastVerified}
          slug={lot.slug}
          kind="parking"
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
          <Link href={`/contribute/parking/${lot.slug}`} asChild>
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed
                  ? colors.brick.deep
                  : colors.brick.DEFAULT,
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
                  fontFamily: "SourceSerif4_600SemiBold",
                }}
              >
                Suggest edit
              </Text>
            </Pressable>
          </Link>
          <ShareButton
            url={`https://charlottegreenways.app/parking/${lot.slug}`}
            title={lot.name}
          />
        </View>
      </View>
    </ScrollView>
  );
}
