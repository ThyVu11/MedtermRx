import { AnatomicalCategory } from "../types";

// Fixed spatial anchor points on the body diagram (viewBox 0 0 300 600).
// The point of a memory palace is a STABLE layout you walk the same way
// every time — so these coordinates are hand-placed, not computed.
export interface OrganLocation {
  category: AnatomicalCategory;
  label: string;
  x: number;
  y: number;
  color: string;
}

export const ORGAN_LOCATIONS: OrganLocation[] = [
  { category: "Neurological", label: "Brain", x: 150, y: 40, color: "#7C3AED" },
  { category: "Sensory", label: "Eyes & Ears", x: 172, y: 72, color: "#DB2777" },
  { category: "Endocrine", label: "Thyroid", x: 150, y: 112, color: "#EA580C" },
  { category: "Respiratory", label: "Lungs", x: 128, y: 155, color: "#0284C7" },
  { category: "Cardiovascular", label: "Heart", x: 168, y: 175, color: "#DC2626" },
  { category: "Gastrointestinal", label: "Stomach", x: 150, y: 245, color: "#CA8A04" },
  { category: "Urinary", label: "Kidneys", x: 178, y: 268, color: "#0891B2" },
  { category: "Musculoskeletal", label: "Joints", x: 128, y: 380, color: "#059669" },
];

// The order a "tour" walks the body — top to bottom, the same route every
// time, which is what makes a memory palace stick.
export const TOUR_ORDER: AnatomicalCategory[] = [
  "Neurological",
  "Respiratory",
  "Cardiovascular",
  "Gastrointestinal",
  "Musculoskeletal",
];
