import type { CSSProperties } from "react";

export const colors = {
  primary500: "#2F6BFF",
  primary600: "#2557D6",
  primarySoft: "rgba(47, 107, 255, 0.16)",
  success500: "#22C55E",
  error500: "#DC2626",
  warning500: "#F59E0B",
  gold500: "#E7C66A",
  goldSoft: "rgba(231, 198, 106, 0.16)",
  bgMain: "#07111F",
  bgSurface: "#0E1A2B",
  bgElevated: "#101D31",
  bgMuted: "#12243C",
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(148, 163, 184, 0.3)",
  textPrimary: "#F8FAFC",
  textSecondary: "#B6C2D1",
  textMuted: "#8FA0B5",
  overlay: "rgba(2, 8, 18, 0.78)"
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
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999
} as const;

export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: "-0.03em"
  },
  h2: {
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.1,
    letterSpacing: "-0.02em"
  },
  h3: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: "-0.02em"
  },
  body: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5
  },
  small: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "0.06em"
  }
} as const;

export const shadows = {
  card: "0 18px 48px rgba(2, 8, 18, 0.28)",
  modal: "0 36px 88px rgba(2, 8, 18, 0.42)"
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
    "radial-gradient(circle at top left, rgba(47, 107, 255, 0.18), transparent 26%), radial-gradient(circle at top right, rgba(231, 198, 106, 0.08), transparent 18%), linear-gradient(180deg, #07111F 0%, #091526 42%, #07101B 100%)",
  color: colors.textPrimary
};

export const surfaceStyle: CSSProperties = {
  background: colors.bgSurface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg
};
