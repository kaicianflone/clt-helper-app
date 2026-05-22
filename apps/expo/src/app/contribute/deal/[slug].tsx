import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { recordContribution } from "~/components/contribution-history";
import { getDeviceIdAsync } from "~/components/device-id";
import { EulaModal } from "~/components/eula-modal";
import { SubmitSuccessOverlay } from "~/components/submit-success-overlay";
import { useEulaGate } from "~/components/use-eula-gate";
import { colors, radius, space, type } from "~/styles/tokens";
import { trpc } from "~/utils/api";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const ALL_DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text
      style={{
        ...type.bodySm,
        color: colors.fg.inkSoft,
        marginBottom: space[1],
        fontFamily: "Inter_600SemiBold",
      }}
    >
      {label}
      {required ? (
        <Text style={{ color: colors.brick.DEFAULT }}> *</Text>
      ) : null}
    </Text>
  );
}

const inputStyle = {
  ...type.bodyMd,
  color: colors.fg.ink,
  backgroundColor: colors.bg.creamSoft,
  borderWidth: 1,
  borderColor: colors.border.soft,
  borderRadius: radius.md,
  paddingHorizontal: space[3],
  paddingVertical: space[3],
  minHeight: 44,
};

export default function ContributeDealScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const eulaGate = useEulaGate();

  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantLat, setRestaurantLat] = useState("");
  const [restaurantLng, setRestaurantLng] = useState("");
  const [latLngError, setLatLngError] = useState<string | null>(null);
  const [dealDescription, setDealDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([]);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [link, setLink] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [prUrl, setPrUrl] = useState<string | undefined>();
  const [timeError, setTimeError] = useState<string | null>(null);

  const mutation = useMutation(trpc.submit.contribute.mutationOptions());

  const toggleDay = (day: DayKey) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async () => {
    if (!eulaGate.accepted) return;
    if (!displayName.trim()) return;

    setTimeError(null);
    setLatLngError(null);

    // Validate time window if not all-day
    if (!isAllDay) {
      if (startTime && !HHMM_REGEX.test(startTime)) {
        setTimeError("Start time must be HH:MM (24h), e.g. 17:00");
        return;
      }
      if (endTime && !HHMM_REGEX.test(endTime)) {
        setTimeError("End time must be HH:MM (24h), e.g. 21:00");
        return;
      }
    }

    // Validate lat/lng
    const latNum = Number(restaurantLat);
    const lngNum = Number(restaurantLng);
    if (!restaurantLat || isNaN(latNum)) {
      setLatLngError("Latitude must be a valid number (e.g. 35.22)");
      return;
    }
    if (!restaurantLng || isNaN(lngNum)) {
      setLatLngError("Longitude must be a valid number (e.g. -80.84)");
      return;
    }

    const patch: Record<string, unknown> = { slug };
    if (restaurantName.trim()) patch.restaurantName = restaurantName.trim();
    if (restaurantAddress.trim())
      patch.restaurantAddress = restaurantAddress.trim();
    patch.restaurantLatLng = [latNum, lngNum];
    if (dealDescription.trim()) patch.dealDescription = dealDescription.trim();
    if (selectedDays.length > 0) patch.daysOfWeek = selectedDays;
    if (link.trim()) patch.link = link.trim();

    if (isAllDay) {
      patch.timeWindow = "all-day";
    } else if (startTime && endTime) {
      patch.timeWindow = { start: startTime, end: endTime };
    }

    const deviceId = await getDeviceIdAsync();

    const result = await mutation.mutateAsync({
      kind: "deal",
      patch,
      note: note.trim(),
      displayName: displayName.trim(),
      deviceId,
      // acceptedAt is guaranteed non-null here: the `if (!eulaGate.accepted) return`
      // guard above ensures we only reach this point when the EULA has been accepted.
      // eulaGate.accepted === (eulaGate.acceptedAt !== null) — see useEulaGate.ts.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      eulaAcceptedAt: eulaGate.acceptedAt!,
    });

    setPrUrl(result.prUrl);

    await recordContribution({
      id: Date.now().toString(),
      kind: "deal",
      slug,
      prUrl: result.prUrl,
      submittedAt: new Date().toISOString(),
    });

    setShowSuccess(true);
  };

  return (
    <>
      <EulaModal
        visible={!eulaGate.accepted}
        onAccept={() => void eulaGate.accept()}
      />

      <SubmitSuccessOverlay
        visible={showSuccess}
        prUrl={prUrl}
        onDismiss={() => {
          setShowSuccess(false);
          router.back();
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg.cream }}
          contentContainerStyle={{
            padding: space[4],
            paddingBottom: space[12],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              ...type.displayMd,
              color: colors.fg.ink,
              marginBottom: space[2],
            }}
          >
            Suggest an edit
          </Text>
          <Text
            style={{
              ...type.bodySm,
              color: colors.fg.inkMuted,
              marginBottom: space[6],
            }}
          >
            Only fill in the fields you want to change.
          </Text>

          {/* Restaurant name */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Restaurant name" />
            <TextInput
              style={inputStyle}
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholder="e.g. Rhino Market"
              placeholderTextColor={colors.fg.inkMuted}
              accessibilityLabel="Restaurant name"
            />
          </View>

          {/* Address */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Restaurant address" />
            <TextInput
              style={inputStyle}
              value={restaurantAddress}
              onChangeText={setRestaurantAddress}
              placeholder="e.g. 1820 South Blvd, Charlotte"
              placeholderTextColor={colors.fg.inkMuted}
              accessibilityLabel="Restaurant address"
            />
          </View>

          {/* Latitude / Longitude */}
          <View
            style={{
              flexDirection: "row",
              gap: space[2],
              marginBottom: space[4],
            }}
          >
            <View style={{ flex: 1 }}>
              <FieldLabel label="Latitude" required />
              <TextInput
                style={inputStyle}
                value={restaurantLat}
                onChangeText={setRestaurantLat}
                placeholder="e.g. 35.22"
                placeholderTextColor={colors.fg.inkMuted}
                keyboardType="decimal-pad"
                accessibilityLabel="Restaurant latitude"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Longitude" required />
              <TextInput
                style={inputStyle}
                value={restaurantLng}
                onChangeText={setRestaurantLng}
                placeholder="e.g. -80.84"
                placeholderTextColor={colors.fg.inkMuted}
                keyboardType="numbers-and-punctuation"
                accessibilityLabel="Restaurant longitude"
              />
            </View>
          </View>
          {latLngError ? (
            <Text
              style={{
                ...type.bodySm,
                color: colors.rose,
                marginBottom: space[3],
              }}
            >
              {latLngError}
            </Text>
          ) : null}

          {/* Deal description */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Deal description" />
            <TextInput
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              value={dealDescription}
              onChangeText={setDealDescription}
              placeholder="e.g. $4 draft beers, half-off appetizers"
              placeholderTextColor={colors.fg.inkMuted}
              multiline
              numberOfLines={3}
              accessibilityLabel="Deal description"
            />
          </View>

          {/* Days of week */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Days of week" />
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}
            >
              {ALL_DAYS.map(({ key, label }) => {
                const isActive = selectedDays.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleDay(key)}
                    style={({ pressed }) => ({
                      paddingHorizontal: space[3],
                      paddingVertical: space[2],
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: isActive
                        ? colors.fg.ink
                        : colors.border.soft,
                      backgroundColor: isActive
                        ? colors.fg.ink
                        : pressed
                          ? colors.bg.creamDeep
                          : colors.bg.creamSoft,
                      minHeight: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={{
                        ...type.bodyXs,
                        color: isActive ? colors.bg.cream : colors.fg.ink,
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Time window */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Time window" />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: space[2],
              }}
            >
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{
                  false: colors.border.soft,
                  true: colors.brick.DEFAULT,
                }}
                thumbColor={colors.bg.creamSoft}
                accessibilityLabel="All day toggle"
              />
              <Text
                style={{
                  ...type.bodyMd,
                  color: colors.fg.ink,
                  marginLeft: space[2],
                }}
              >
                All day
              </Text>
            </View>
            {!isAllDay ? (
              <View style={{ flexDirection: "row", gap: space[2] }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Start (HH:MM)" />
                  <TextInput
                    style={inputStyle}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="17:00"
                    placeholderTextColor={colors.fg.inkMuted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    accessibilityLabel="Start time in HH:MM format"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="End (HH:MM)" />
                  <TextInput
                    style={inputStyle}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="21:00"
                    placeholderTextColor={colors.fg.inkMuted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    accessibilityLabel="End time in HH:MM format"
                  />
                </View>
              </View>
            ) : null}
            {timeError ? (
              <Text
                style={{
                  ...type.bodySm,
                  color: colors.rose,
                  marginTop: space[1],
                }}
              >
                {timeError}
              </Text>
            ) : null}
          </View>

          {/* Link */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Link (URL)" />
            <TextInput
              style={inputStyle}
              value={link}
              onChangeText={setLink}
              placeholder="https://restaurantwebsite.com/happyhour"
              placeholderTextColor={colors.fg.inkMuted}
              keyboardType="url"
              autoCapitalize="none"
              accessibilityLabel="Link URL"
            />
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border.soft,
              marginVertical: space[4],
            }}
          />

          {/* Display name */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Your name or handle" required />
            <TextInput
              style={inputStyle}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. DealHunter_CLT"
              placeholderTextColor={colors.fg.inkMuted}
              autoCapitalize="none"
              accessibilityLabel="Your name or handle (required)"
            />
          </View>

          {/* Note */}
          <View style={{ marginBottom: space[6] }}>
            <FieldLabel label="Note to maintainers" />
            <TextInput
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              value={note}
              onChangeText={setNote}
              placeholder="Any context for your edit…"
              placeholderTextColor={colors.fg.inkMuted}
              multiline
              numberOfLines={3}
              maxLength={500}
              accessibilityLabel="Note to maintainers"
            />
            <Text
              style={{
                ...type.bodyXs,
                color: colors.fg.inkMuted,
                marginTop: space[1],
                textAlign: "right",
              }}
            >
              {note.length}/500
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={mutation.isPending || !displayName.trim()}
            style={({ pressed }) => ({
              backgroundColor:
                mutation.isPending || !displayName.trim()
                  ? colors.brick.soft
                  : pressed
                    ? colors.brick.deep
                    : colors.brick.DEFAULT,
              borderRadius: radius.md,
              paddingVertical: space[3],
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            })}
            accessibilityRole="button"
            accessibilityLabel="Submit suggestion"
          >
            {mutation.isPending ? (
              <ActivityIndicator color={colors.bg.creamSoft} />
            ) : (
              <Text
                style={{
                  ...type.bodyMd,
                  color: colors.bg.creamSoft,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Submit suggestion
              </Text>
            )}
          </Pressable>

          {mutation.isError ? (
            <Text
              style={{
                ...type.bodySm,
                color: colors.rose,
                marginTop: space[3],
                textAlign: "center",
              }}
            >
              {mutation.error.message}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
