import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Rect, Ellipse, Text as SvgText } from "react-native-svg";
import { ORGAN_LOCATIONS } from "../data/organLocations";
import { AnatomicalCategory } from "../types/types";

interface Props {
  onSelectOrgan: (category: AnatomicalCategory) => void;
  progressByCategory?: Record<string, number>; // 0-1 fraction of terms with a saved note
}

export default function BodyDiagram({
  onSelectOrgan,
  progressByCategory,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Svg viewBox="0 0 300 600" width="100%" height={420}>
        {/* Simple stylized silhouette — just enough structure to anchor pins to */}
        <Circle cx={150} cy={55} r={38} fill="#E5E7EB" />
        <Rect x={130} y={90} width={40} height={20} fill="#E5E7EB" />
        <Rect x={95} y={108} width={110} height={175} rx={24} fill="#E5E7EB" />
        <Rect x={55} y={115} width={35} height={140} rx={16} fill="#E5E7EB" />
        <Rect x={210} y={115} width={35} height={140} rx={16} fill="#E5E7EB" />
        <Rect x={110} y={280} width={35} height={200} rx={16} fill="#E5E7EB" />
        <Rect x={155} y={280} width={35} height={200} rx={16} fill="#E5E7EB" />
        <Ellipse cx={128} cy={480} rx={22} ry={12} fill="#E5E7EB" />
        <Ellipse cx={172} cy={480} rx={22} ry={12} fill="#E5E7EB" />

        {/* Organ pins */}
        {ORGAN_LOCATIONS.map((organ) => {
          const progress = progressByCategory?.[organ.category] ?? 0;
          const hasProgress = progress > 0;
          return (
            <React.Fragment key={organ.category}>
              <Circle
                cx={organ.x}
                cy={organ.y}
                r={16}
                fill={organ.color}
                fillOpacity={hasProgress ? 1 : 0.55}
                stroke="#ffffff"
                strokeWidth={2}
                onPress={() => onSelectOrgan(organ.category)}
              />
              {hasProgress && progress >= 1 && (
                <SvgText
                  x={organ.x}
                  y={organ.y + 4}
                  fontSize={14}
                  fill="#ffffff"
                  textAnchor="middle"
                  onPress={() => onSelectOrgan(organ.category)}
                >
                  ✓
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legend}>
        {ORGAN_LOCATIONS.map((organ) => (
          <View key={organ.category} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: organ.color }]} />
            <Text style={styles.legendText}>
              {organ.label} — {organ.category}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  legend: {
    marginTop: 12,
    gap: 6,
    alignSelf: "stretch",
    paddingHorizontal: 20,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: "#4B5563" },
});
