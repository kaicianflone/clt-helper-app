import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { colors, radius, space, type } from "~/styles/tokens";

interface EulaModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function EulaModal({ visible, onAccept }: EulaModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.fg.ink + "66",
          alignItems: "center",
          justifyContent: "center",
          padding: space[4],
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg.cream,
            borderRadius: radius.lg,
            padding: space[6],
            maxWidth: 440,
            width: "100%",
          }}
        >
          <Text
            style={{ ...type.displayMd, color: colors.fg.ink }}
            accessibilityRole="header"
          >
            Before you contribute
          </Text>
          <Text
            style={{
              ...type.bodySm,
              color: colors.fg.inkSoft,
              marginTop: space[3],
            }}
          >
            By submitting an edit, you agree:
          </Text>
          <ScrollView style={{ maxHeight: 220, marginTop: space[2] }}>
            {[
              "You won't submit profanity, hate speech, or content that targets individuals",
              "You won't submit personal information about anyone (names, contacts, addresses of private people)",
              "Your submission is fact-based and accurate to the best of your knowledge",
              "Submissions become public pull requests visible on GitHub",
            ].map((item, i) => (
              <View
                key={i}
                style={{ flexDirection: "row", marginBottom: space[2] }}
              >
                <Text
                  style={{
                    ...type.bodySm,
                    color: colors.fg.inkSoft,
                    marginRight: space[2],
                  }}
                >
                  •
                </Text>
                <Text
                  style={{ ...type.bodySm, color: colors.fg.inkSoft, flex: 1 }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => ({
              marginTop: space[6],
              backgroundColor: pressed
                ? colors.brick.deep
                : colors.brick.DEFAULT,
              borderRadius: radius.md,
              paddingVertical: space[3],
              paddingHorizontal: space[4],
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            })}
            accessibilityRole="button"
            accessibilityLabel="I agree — continue"
          >
            <Text
              style={{
                ...type.bodyMd,
                color: colors.bg.creamSoft,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              I agree — continue
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
