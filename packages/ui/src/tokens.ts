import type { CSSProperties } from "react";

export const colors = {
  primary400: "#5C8DFF",
  primary500: "#2F6BFF",
  primary600: "#2557D6",
  primarySoft: "rgba(47, 107, 255, 0.18)",
  primarySurface: "rgba(47, 107, 255, 0.12)",
  success500: "#22C55E",
  error500: "#DC2626",
  warning500: "#F59E0B",
  gold500: "#E7C66A",
  goldSoft: "rgba(231, 198, 106, 0.16)",
  bgMain: "#F0F1F3",
  bgSurface: "#FFFFFF",
  bgSurfaceRaised: "#F5F6F8",
  bgSurfaceHighlight: "rgba(0, 82, 204, 0.06)",
  bgElevated: "#F7F8FA",
  bgInteractive: "#EBF0F7",
  bgMuted: "#ECEEF2",
  bgInset: "rgba(15, 23, 42, 0.04)",
  borderSubtle: "rgba(148, 163, 184, 0.12)",
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(148, 163, 184, 0.3)",
  textPrimary: "#F3F7FC",
  textSecondary: "#C2CCD9",
  textMuted: "#92A3BA",
  textFaint: "#73849A",
  overlay: "rgba(2, 8, 18, 0.78)"
} as const;

export const spacing = {
  4: 4,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
  28: 28,
  32: 32
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999
} as const;

export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: "-0.03em"
  },
  h2: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.12,
    letterSpacing: "-0.02em"
  },
  h3: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "-0.01em"
  },
  lead: {
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.5
  },
  body: {
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.5
  },
  small: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "0.04em"
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "0.06em"
  }
} as const;

export const shadows = {
  soft: "0 1px 2px rgba(15, 23, 42, 0.03), 0 1px 3px rgba(15, 23, 42, 0.05)",
  card: "0 2px 10px rgba(15, 23, 42, 0.06)",
  modal: "0 16px 40px rgba(15, 23, 42, 0.14)"
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
  fontFamily: "Sora, Manrope, Inter, system-ui, sans-serif",
  background:
    "radial-gradient(circle at top left, rgba(47, 107, 255, 0.2), transparent 28%), radial-gradient(circle at top right, rgba(231, 198, 106, 0.09), transparent 20%), linear-gradient(180deg, #06101C 0%, #0A1628 38%, #081320 100%)",
  color: colors.textPrimary
};

export const surfaceStyle: CSSProperties = {
  background: colors.bgSurface,
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: radii.lg
};
