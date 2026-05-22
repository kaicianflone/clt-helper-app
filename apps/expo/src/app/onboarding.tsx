import { useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, space, type } from "~/styles/tokens";

const ONBOARDING_KEY = "clt-onboarding-seen";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Charlotte\nGreenways",
    body: "Discover trails, parking, and happy hour deals across the Queen City — all in one place.",
  },
  {
    title: "Always\nFresh",
    body: "Community-verified data means you get accurate hours, closures, and deal info before you leave home.",
  },
  {
    title: "Your City,\nYour Finds",
    body: "Spot a new deal or a trail update? Submit it in seconds and help your neighbors.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, new Date().toISOString());
    router.replace("/(tabs)");
  };

  const skip = () => void finish();

  const next = () => {
    if (page < SLIDES.length - 1) {
      const nextPage = page + 1;
      scrollRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
      setPage(nextPage);
    } else {
      void finish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.cream }}>
      {/* Skip button */}
      <View
        style={{
          position: "absolute",
          top: space[12],
          right: space[4],
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={skip}
          hitSlop={8}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
        >
          <Text style={{ ...type.bodyMd, color: colors.fg.inkMuted }}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newPage = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setPage(newPage);
        }}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              paddingHorizontal: space[6],
              paddingTop: space[16],
              paddingBottom: space[8],
              justifyContent: "flex-end",
            }}
          >
            <Text style={{ ...type.displayLg, color: colors.fg.ink }}>
              {slide.title}
            </Text>
            <Text
              style={{
                ...type.bodyLg,
                color: colors.fg.inkSoft,
                marginTop: space[4],
              }}
            >
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space[6],
          paddingBottom: space[8],
          paddingTop: space[4],
        }}
      >
        {/* Dots */}
        <View style={{ flexDirection: "row", gap: space[2] }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === page ? colors.brick.DEFAULT : colors.border.soft,
              }}
            />
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={next}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.brick.deep : colors.brick.DEFAULT,
            paddingHorizontal: space[6],
            paddingVertical: space[3],
            borderRadius: 8,
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          })}
          accessibilityRole="button"
          accessibilityLabel={
            page === SLIDES.length - 1 ? "Get started" : "Next"
          }
        >
          <Text
            style={{
              ...type.bodyMd,
              color: colors.bg.creamSoft,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {page === SLIDES.length - 1 ? "Get started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
