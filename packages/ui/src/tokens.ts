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
  bgMain: "#06101C",
  bgCanvas: "#0A1628",
  bgSurface: "#0F1B2F",
  bgElevated: "#142238",
  bgInteractive: "#182A43",
  bgMuted: "#12243C",
  bgInset: "rgba(255, 255, 255, 0.035)",
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
  sm: 8,
  md: 14,
  lg: 18,
  xl: 28,
  pill: 999
} as const;

export const typography = {
  h1: {
    fontSize: 36,
    fontWeight: 800,
    lineHeight: 1.02,
    letterSpacing: "-0.04em"
  },
  h2: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.06,
    letterSpacing: "-0.03em"
  },
  h3: {
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.12,
    letterSpacing: "-0.02em"
  },
  lead: {
    fontSize: 17,
    fontWeight: 500,
    lineHeight: 1.45
  },
  body: {
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.5
  },
  small: {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "0.08em"
  }
} as const;

export const shadows = {
  soft: "0 10px 30px rgba(2, 8, 18, 0.16)",
  card: "0 22px 56px rgba(2, 8, 18, 0.28)",
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
