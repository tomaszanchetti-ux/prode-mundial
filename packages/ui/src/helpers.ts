import type { TeamDisplayProps } from "./types";

// ── Size class maps ────────────────────────────────────

export const flagSizeClasses = {
  sm: "w-[22px] h-[22px]",
  md: "w-7 h-7",
  lg: "w-[34px] h-[34px]"
} as const;

export const flagSizes = { sm: 22, md: 28, lg: 34 } as const;

export const teamTextClasses = {
  sm: "text-[14px]",
  md: "text-[16px]",
  lg: "text-[18px]"
} as const;

export const codeTextClasses = {
  sm: "text-[10px]",
  md: "text-[10px]",
  lg: "text-[11px]"
} as const;

export const weightClasses: Record<500 | 600 | 700, string> = {
  500: "font-medium",
  600: "font-semibold",
  700: "font-bold"
};

// ── Helpers ────────────────────────────────────────────

const missingFlagWarnings = new Set<string>();

export function resolveTeamName(team: Pick<TeamDisplayProps, "name" | "teamName">) {
  return team.teamName ?? team.name ?? "Seleccion";
}

export function resolveTeamFlagSrc(team: Pick<TeamDisplayProps, "flagAsset" | "flagUrl">) {
  return team.flagAsset ?? team.flagUrl ?? null;
}

export function warnMissingFlag(teamName: string, fifaCode?: string | null) {
  const runtime = globalThis as { process?: { env?: { NODE_ENV?: string } } };
  if (runtime.process?.env?.NODE_ENV === "production") return;
  const key = `${fifaCode ?? "unknown"}:${teamName}`;
  if (missingFlagWarnings.has(key)) return;
  missingFlagWarnings.add(key);
  console.warn(`[ui] Missing flag asset for ${teamName}${fifaCode ? ` (${fifaCode})` : ""}.`);
}

export function getFlagFallback(teamName: string) {
  return teamName.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

export function normalizeScoreValue(value: string) {
  if (value === "") return "";
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return "";
  return String(parsed);
}

export function stepScoreValue(value: string, delta: number) {
  const current = value === "" ? 0 : Number.parseInt(value, 10);
  return String(Math.max(0, current + delta));
}
