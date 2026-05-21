import { useEffect, useState } from "react";
import { Animated, View } from "react-native";

import { colors, space } from "~/styles/tokens";

function SkeletonRow() {
  // Animated.Value is not a React ref — store in state so it's stable across renders
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        opacity,
        paddingVertical: space[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.soft,
      }}
    >
      <View
        style={{
          height: 20,
          width: "66%",
          borderRadius: 4,
          backgroundColor: colors.bg.creamDeep,
        }}
      />
      <View
        style={{
          height: 12,
          width: "33%",
          borderRadius: 4,
          backgroundColor: colors.bg.creamDeep,
          marginTop: space[2],
        }}
      />
    </Animated.View>
  );
}

interface ListSkeletonProps {
  rows?: number;
}

export function ListSkeleton({ rows = 6 }: ListSkeletonProps) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}
