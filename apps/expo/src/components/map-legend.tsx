import { Pressable, ScrollView, Text, View } from "react-native";

import type { LayerVisibility, MapKindConfig } from "~/map/kinds";
import { colors, radius, space, type } from "~/styles/tokens";

interface MapLegendProps {
  configs: readonly MapKindConfig[];
  visibility: LayerVisibility;
  onToggle: (kind: string) => void;
}

/**
 * Overlay legend for the mobile map screen.
 *
 * Renders one row per kind:
 *   [color swatch] [label]   (tap to toggle visibility)
 *
 * Inactive (hidden) layers show the swatch at reduced opacity and label
 * in muted ink to communicate the off state without removing the entry.
 */
export function MapLegend({ configs, visibility, onToggle }: MapLegendProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: space[4],
        right: space[4],
        backgroundColor: colors.bg.creamSoft,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border.soft,
        paddingVertical: space[2],
        paddingHorizontal: space[3],
        maxHeight: 320,
        minWidth: 152,
        // Subtle warm shadow per DESIGN.md elevation spec
        shadowColor: colors.fg.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Text
        style={{
          ...type.bodyXs,
          color: colors.fg.inkMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: space[2],
        }}
      >
        Layers
      </Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: space[2] }}
      >
        {configs.map((config) => {
          const isVisible = visibility[config.kind] !== false;
          return (
            <Pressable
              key={config.kind}
              onPress={() => onToggle(config.kind)}
              accessibilityRole="switch"
              accessibilityState={{ checked: isVisible }}
              accessibilityLabel={`${config.label} layer`}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: space[2],
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {/* Color swatch — circle for point layers, pill for line layers */}
              <View
                style={{
                  width: config.layerType === "line" ? 16 : 10,
                  height: 10,
                  borderRadius:
                    config.layerType === "line" ? radius.sm : radius.full,
                  backgroundColor: config.color,
                  opacity: isVisible ? 1 : 0.35,
                }}
              />
              <Text
                style={{
                  ...type.bodySm,
                  color: isVisible ? colors.fg.inkSoft : colors.fg.inkMuted,
                  flexShrink: 1,
                }}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
