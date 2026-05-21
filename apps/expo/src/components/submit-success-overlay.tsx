import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  Text,
} from "react-native";

import { colors, radius, space, type } from "~/styles/tokens";

interface SubmitSuccessOverlayProps {
  visible: boolean;
  prUrl?: string;
  onDismiss: () => void;
}

export function SubmitSuccessOverlay({
  visible,
  prUrl,
  onDismiss,
}: SubmitSuccessOverlayProps) {
  // Store Animated.Values in state so they are stable and not refs
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    if (!visible) return;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        opacity.setValue(1);
        scale.setValue(1);
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    const timer = setTimeout(() => onDismiss(), 5000);
    return () => clearTimeout(timer);
  }, [visible, opacity, scale, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      accessibilityViewIsModal
      onRequestClose={onDismiss}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.fg.ink + "99",
          alignItems: "center",
          justifyContent: "center",
          padding: space[6],
        }}
        onPress={onDismiss}
        accessibilityLabel="Dismiss success overlay"
      >
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
            backgroundColor: colors.bg.cream,
            borderRadius: radius.lg,
            padding: space[8],
            alignItems: "center",
            maxWidth: 360,
            width: "100%",
          }}
        >
          <Text
            style={{
              fontSize: 56,
              lineHeight: 64,
              color: colors.green,
            }}
            accessibilityLabel="Success checkmark"
          >
            ✓
          </Text>
          <Text
            style={{
              ...type.headingLg,
              color: colors.fg.ink,
              marginTop: space[4],
              textAlign: "center",
            }}
          >
            Your suggestion is in
          </Text>
          {prUrl ? (
            <Text
              style={{
                ...type.bodySm,
                color: colors.fg.inkMuted,
                marginTop: space[2],
                textAlign: "center",
              }}
            >
              {prUrl}
            </Text>
          ) : null}
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => ({
              marginTop: space[6],
              paddingHorizontal: space[6],
              paddingVertical: space[3],
              borderRadius: radius.md,
              backgroundColor: pressed
                ? colors.brick.deep
                : colors.brick.DEFAULT,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            })}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text
              style={{
                ...type.bodyMd,
                color: colors.bg.creamSoft,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Done
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
