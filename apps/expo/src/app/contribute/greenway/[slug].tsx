import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
        fontFamily: "SourceSerif4_600SemiBold",
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

export default function ContributeGreenwayScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const eulaGate = useEulaGate();

  const [name, setName] = useState("");
  const [lengthMiles, setLengthMiles] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [prUrl, setPrUrl] = useState<string | undefined>();

  const mutation = useMutation(trpc.submit.contribute.mutationOptions());

  const handleSubmit = async () => {
    if (!eulaGate.accepted) return;
    if (!displayName.trim()) return;

    const patch: Record<string, unknown> = { slug };
    if (name.trim()) patch.name = name.trim();
    if (lengthMiles.trim()) {
      const miles = parseFloat(lengthMiles);
      if (!isNaN(miles) && miles > 0) patch.lengthMiles = miles;
    }
    if (description.trim()) patch.description = description.trim();

    const deviceId = await getDeviceIdAsync();

    const result = await mutation.mutateAsync({
      kind: "greenway",
      patch,
      note: note.trim(),
      displayName: displayName.trim(),
      deviceId,
      // acceptedAt is guaranteed non-null here: the `if (!eulaGate.accepted) return`
      // guard above ensures we only reach this point when the EULA has been accepted.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      eulaAcceptedAt: eulaGate.acceptedAt!,
    });

    setPrUrl(result.prUrl);

    await recordContribution({
      id: Date.now().toString(),
      kind: "greenway",
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

          {/* Name */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Trail name" />
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Little Sugar Creek Greenway"
              placeholderTextColor={colors.fg.inkMuted}
              accessibilityLabel="Trail name"
            />
          </View>

          {/* Length */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Length (miles)" />
            <TextInput
              style={inputStyle}
              value={lengthMiles}
              onChangeText={setLengthMiles}
              placeholder="e.g. 7.5"
              placeholderTextColor={colors.fg.inkMuted}
              keyboardType="decimal-pad"
              accessibilityLabel="Length in miles"
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: space[4] }}>
            <FieldLabel label="Description" />
            <TextInput
              style={[inputStyle, { minHeight: 100, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the trail…"
              placeholderTextColor={colors.fg.inkMuted}
              multiline
              numberOfLines={4}
              accessibilityLabel="Description"
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
              placeholder="e.g. TrailFan_42"
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
                  fontFamily: "SourceSerif4_600SemiBold",
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
