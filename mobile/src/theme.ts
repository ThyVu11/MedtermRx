/**
 * RootRx design tokens.
 *
 * Direction: "field-guide specimen label" — the visual language of a
 * dissection tray and museum specimen tags, not a generic health-app
 * blue-and-white. Word parts are treated like tagged specimens: each
 * prefix/root/suffix gets its own ink color, as if labeled with a
 * different colored pin.
 */

export const colors = {
  ink: "#16231F",
  paper: "#F1F3EC",
  paperDim: "#E4E8DD",
  line: "#CBD1C2",

  teal: "#0F5257",
  tealDark: "#0A3A3D",

  prefix: "#C97A2B",
  root: "#0F5257",
  suffix: "#6B3FA0",
  combiningVowel: "#5B6B5A",

  danger: "#B23A2E",
  dangerBg: "#F6E2DE",
  success: "#2E7D4F",
  successBg: "#E1F0E5",
  warningBg: "#FBEFD9",

  textPrimary: "#16231F",
  textSecondary: "#54604F",
  textOnDark: "#F1F3EC",
  textOnBrand: "#F1F3EC",
} as const;

export const typography = {
  display: {
    fontFamily: "serif" as const,
    fontWeight: "700" as const,
  },
  label: {
    fontFamily: "System" as const,
    fontWeight: "600" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
  body: {
    fontFamily: "System" as const,
    fontWeight: "400" as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  tag: 8,
  pill: 999,
} as const;

export const partColor = (type: string): string => {
  switch (type) {
    case "prefix":
      return colors.prefix;
    case "root":
      return colors.root;
    case "suffix":
      return colors.suffix;
    case "combining_vowel":
      return colors.combiningVowel;
    default:
      return colors.textSecondary;
  }
};
