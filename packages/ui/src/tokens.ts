import type { CSSProperties } from "react";

export const colors = {
  primary500: "#3B82F6",
  primary700: "#1D4ED8",
  success500: "#16A34A",
  error500: "#DC2626",
  warning500: "#F59E0B",
  bgMain: "#0F172A",
  bgSurface: "#111827",
  bgElevated: "#182235",
  border: "#1F2937",
  borderStrong: "#334155",
  textPrimary: "#F9FAFB",
  textSecondary: "#9CA3AF",
  textMuted: "#94A3B8",
  overlay: "rgba(15, 23, 42, 0.82)"
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
  card: "0 20px 40px rgba(2, 6, 23, 0.24)",
  modal: "0 32px 72px rgba(2, 6, 23, 0.42)"
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
    "radial-gradient(circle at top, rgba(59, 130, 246, 0.16), transparent 28%), linear-gradient(180deg, #0f172a 0%, #111827 52%, #0b1220 100%)",
  color: colors.textPrimary
};

export const surfaceStyle: CSSProperties = {
  background: colors.bgSurface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg
};
