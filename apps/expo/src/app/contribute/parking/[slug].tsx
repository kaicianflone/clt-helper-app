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

import { trpc } from "~/utils/api";
import { EulaModal } from "~/components/eula-modal";
import { SubmitSuccessOverlay } from "~/components/submit-success-overlay";
import { useEulaGate } from "~/components/use-eula-gate";
import { getDeviceIdAsync } from "~/components/device-id";
import { recordContribution } from "~/components/contribution-history";
import { colors, radius, space, type } from "~/styles/tokens";

type PaymentMethod = "cash" | "card" | "app" | "meter";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type HoursMode = "open" | "closed" | "24h";

interface DayHoursState {
  mode: HoursMode;
  open: string;
  close: string;
}

const ALL_DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "app", label: "App" },
  { key: "meter", label: "Meter" },
];

const HOURS_MODES: { key: HoursMode; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "24h", label: "24h" },
  { key: "closed", label: "Closed" },
];

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
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

const defaultDayState = (): DayHoursState => ({
  mode: "open",
  open: "",
  close: "",
});

export default function ContributeParkingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const eulaGate = useEulaGate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [operator, setOperator] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyMax, setDailyMax] = useState("");
  const [covered, setCovered] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<PaymentMethod[]>([]);

  const [dayHours, setDayHours] = useState<Record<DayKey, DayHoursState>>({
    mon: defaultDayState(),
    tue: defaultDayState(),
    wed: defaultDayState(),
    thu: defaultDayState(),
    fri: defaultDayState(),
    sat: defaultDayState(),
    sun: defaultDayState(),
  });

  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [prUrl, setPrUrl] = useState<string | undefined>();
  const [hoursError, setHoursError] = useState<string | null>(null);

  const mutation = useMutation(trpc.submit.contribute.mutationOptions());

  const togglePayment = (method: PaymentMethod) => {
    setSelectedPayments((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  };

  const updateDayHours = (day: DayKey, update: Partial<DayHoursState>) => {
    setDayHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...update },
    }));
  };

  const buildHoursPatch = (): { patch: Record<string, unknown> | null; error: string | null } => {
    const patch: Record<string, unknown> = {};
    let hasAny = false;

    for (const { key } of ALL_DAYS) {
      const dh = dayHours[key];
      if (dh.mode === "closed") {
        patch[key] = "closed";
        hasAny = true;
      } else if (dh.mode === "24h") {
        patch[key] = "24h";
        hasAny = true;
      } else if (dh.open || dh.close) {
        if (dh.open && !HHMM_REGEX.test(dh.open)) {
          return { patch: null, error: `${key} open time must be HH:MM (24h)` };
        }
        if (dh.close && !HHMM_REGEX.test(dh.close)) {
          return { patch: null, error: `${key} close time must be HH:MM (24h)` };
        }
        if (dh.open && dh.close) {
          patch[key] = { open: dh.open, close: dh.close };
          hasAny = true;
        }
      }
    }

    return { patch: hasAny ? patch : null, error: null };
  };

  const handleSubmit = async () => {
    if (!eulaGate.accepted) return;
    if (!displayName.trim()) return;

    setHoursError(null);

    const patch: Record<string, unknown> = { slug };
    if (name.trim()) patch.name = name.trim();
    if (address.trim()) patch.address = address.trim();
    if (operator.trim()) patch.operator = operator.trim();

    if (hourlyRate.trim()) {
      const rate = parseFloat(hourlyRate);
      if (!isNaN(rate)) patch.hourlyRate = rate;
    }

    if (dailyMax.trim()) {
      const max = parseFloat(dailyMax);
      if (!isNaN(max)) patch.dailyMax = max;
    }

    patch.covered = covered;

    if (selectedPayments.length > 0) {
      patch.paymentMethods = selectedPayments;
    }

    const { patch: hoursPatch, error: hoursValidationError } = buildHoursPatch();
    if (hoursValidationError) {
      setHoursError(hoursValidationError);
      return;
    }
    if (hoursPatch) patch.hours = hoursPatch;

    const deviceId = await getDeviceIdAsync();

    const result = await mutation.mutateAsync({
      kind: "parking",
      patch,
      note: note.trim(),
      displayName: displayName.trim(),
      deviceId,
      eulaAcceptedAt: eulaGate.acceptedAt ?? new Date().toISOString(),
    });

    setPrUrl(result.prUrl);

    await recordContribution({
      id: Date.now().toString(),
      kind: "parking",
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
          contentContainerStyle={{ padding: space[4], paddingBottom: space[12] }}
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

          {/* Name */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Lot name" />
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Uptown Deck 1"
              placeholderTextColor={colors.fg.inkMuted}
              accessibilityLabel="Lot name"
            />
          </View>

          {/* Address */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Address" />
            <TextInput
              style={inputStyle}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 200 S Tryon St, Charlotte"
              placeholderTextColor={colors.fg.inkMuted}
              accessibilityLabel="Address"
            />
          </View>

          {/* Operator */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Operator" />
            <TextInput
              style={inputStyle}
              value={operator}
              onChangeText={setOperator}
              placeholder="e.g. City of Charlotte"
              placeholderTextColor={colors.fg.inkMuted}
              accessibilityLabel="Operator"
            />
          </View>

          {/* Rates */}
          <View style={{ flexDirection: "row", gap: space[2], marginBottom: space[4] }}>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Hourly rate ($)" />
              <TextInput
                style={inputStyle}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="e.g. 4.00"
                placeholderTextColor={colors.fg.inkMuted}
                keyboardType="decimal-pad"
                accessibilityLabel="Hourly rate in dollars"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Daily max ($)" />
              <TextInput
                style={inputStyle}
                value={dailyMax}
                onChangeText={setDailyMax}
                placeholder="e.g. 24"
                placeholderTextColor={colors.fg.inkMuted}
                keyboardType="decimal-pad"
                accessibilityLabel="Daily maximum in dollars"
              />
            </View>
          </View>

          {/* Covered */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: space[4],
            }}
          >
            <Switch
              value={covered}
              onValueChange={setCovered}
              trackColor={{
                false: colors.border.soft,
                true: colors.brick.DEFAULT,
              }}
              thumbColor={colors.bg.creamSoft}
              accessibilityLabel="Covered parking toggle"
            />
            <Text
              style={{
                ...type.bodyMd,
                color: colors.fg.ink,
                marginLeft: space[2],
              }}
            >
              Covered parking
            </Text>
          </View>

          {/* Payment methods */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Payment methods" />
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}
            >
              {PAYMENT_OPTIONS.map(({ key, label }) => {
                const isActive = selectedPayments.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => togglePayment(key)}
                    style={({ pressed }) => ({
                      paddingHorizontal: space[3],
                      paddingVertical: space[2],
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: isActive ? colors.fg.ink : colors.border.soft,
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

          {/* Hours grid */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Hours" />
            <Text
              style={{
                ...type.bodyXs,
                color: colors.fg.inkMuted,
                marginBottom: space[2],
              }}
            >
              Only fill in days you want to update. Times in HH:MM (24h).
            </Text>
            {ALL_DAYS.map(({ key, label }) => {
              const dh = dayHours[key];
              return (
                <View
                  key={key}
                  style={{
                    marginBottom: space[3],
                    borderWidth: 1,
                    borderColor: colors.border.soft,
                    borderRadius: radius.md,
                    padding: space[3],
                    backgroundColor: colors.bg.creamSoft,
                  }}
                >
                  <Text
                    style={{
                      ...type.bodySm,
                      color: colors.fg.ink,
                      fontFamily: "Inter_600SemiBold",
                      marginBottom: space[2],
                    }}
                  >
                    {label}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: space[2],
                      marginBottom: space[2],
                    }}
                  >
                    {HOURS_MODES.map(({ key: modeKey, label: modeLabel }) => {
                      const isActive = dh.mode === modeKey;
                      return (
                        <Pressable
                          key={modeKey}
                          onPress={() =>
                            updateDayHours(key, { mode: modeKey })
                          }
                          style={({ pressed }) => ({
                            flex: 1,
                            paddingVertical: space[2],
                            borderRadius: radius.sm,
                            borderWidth: 1,
                            borderColor: isActive
                              ? colors.fg.ink
                              : colors.border.soft,
                            backgroundColor: isActive
                              ? colors.fg.ink
                              : pressed
                                ? colors.bg.creamDeep
                                : colors.bg.cream,
                            minHeight: 44,
                            alignItems: "center",
                            justifyContent: "center",
                          })}
                          accessibilityRole="button"
                          accessibilityLabel={`${label} ${modeLabel}`}
                          accessibilityState={{ selected: isActive }}
                        >
                          <Text
                            style={{
                              ...type.bodyXs,
                              color: isActive ? colors.bg.cream : colors.fg.ink,
                              textTransform: "uppercase",
                            }}
                          >
                            {modeLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {dh.mode === "open" ? (
                    <View style={{ flexDirection: "row", gap: space[2] }}>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          style={{ ...inputStyle, ...type.bodySm }}
                          value={dh.open}
                          onChangeText={(v) =>
                            updateDayHours(key, { open: v })
                          }
                          placeholder="08:00"
                          placeholderTextColor={colors.fg.inkMuted}
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                          accessibilityLabel={`${label} open time`}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          style={{ ...inputStyle, ...type.bodySm }}
                          value={dh.close}
                          onChangeText={(v) =>
                            updateDayHours(key, { close: v })
                          }
                          placeholder="22:00"
                          placeholderTextColor={colors.fg.inkMuted}
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                          accessibilityLabel={`${label} close time`}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {hoursError ? (
              <Text style={{ ...type.bodySm, color: colors.rose }}>
                {hoursError}
              </Text>
            ) : null}
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
              placeholder="e.g. ParkingPro_CLT"
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
