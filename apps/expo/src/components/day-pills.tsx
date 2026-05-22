import { Pressable, ScrollView, Text } from "react-native";

import { colors, radius, space, type } from "~/styles/tokens";

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

interface DayPillsProps {
  selected: string;
  onSelect: (day: string) => void;
}

export function DayPills({ selected, onSelect }: DayPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space[2], paddingVertical: space[1] }}
    >
      {DAYS.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
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
    </ScrollView>
  );
}
