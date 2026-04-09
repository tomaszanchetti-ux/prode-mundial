import type { CSSProperties } from "react";

export const colors = {
  primary500: "#D94A39",
  primary700: "#9F2C28",
  success500: "#3BAA6A",
  error500: "#D1495B",
  warning500: "#C8A85D",
  bgMain: "#07131F",
  bgSurface: "#0D1B2A",
  bgElevated: "#14263A",
  border: "#22384C",
  borderStrong: "#36546D",
  textPrimary: "#F7F1E8",
  textSecondary: "#B8C7D6",
  textMuted: "#8FA4B7",
  overlay: "rgba(3, 10, 18, 0.82)"
} as const;

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 24,
  pill: 999
} as const;

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.15
  },
  h2: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.2
  },
  h3: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.25
  },
  body: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.45
  },
  small: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.4
  }
} as const;

export const shadows = {
  card: "0 22px 54px rgba(1, 8, 16, 0.34)",
  modal: "0 36px 88px rgba(1, 8, 16, 0.48)"
} as const;

export const uiTheme = {
  colors,
  spacing,
  radii,
  typography,
  shadows
} as const;

export const appBackgroundStyle: CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  fontFamily: "Inter, system-ui, sans-serif",
  background:
    "radial-gradient(circle at top left, rgba(201, 82, 56, 0.24), transparent 24%), radial-gradient(circle at top right, rgba(200, 168, 93, 0.18), transparent 22%), linear-gradient(180deg, #07131f 0%, #0c1c2d 44%, #08131d 100%)",
  color: colors.textPrimary
};

export const surfaceStyle: CSSProperties = {
  background: colors.bgSurface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg
};
