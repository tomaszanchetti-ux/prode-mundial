import type { TeamData } from "./types";

// ── Size class maps ────────────────────────────────────

export const flagSizeClasses = {
  sm: "w-[22px] h-[22px]",
  md: "w-7 h-7",
  lg: "w-[34px] h-[34px]"
} as const;

export const flagSizes = { sm: 22, md: 28, lg: 34 } as const;

// ── Flag resolution ───────────────────────────────────

type FlagResult = { src: string | null; fallbackLabel: string };

/**
 * Robust flag resolver with fallback chain:
 * 1. flagAsset (pre-resolved static path)
 * 2. flagUrl (external URL from API)
 * 3. /flags/{iso2}.svg (constructed from iso2 code)
 * 4. null → UI renders monogram fallback
 *
 * fallbackLabel: fifaCode (3 letters, e.g. ARG) if available,
 * else first 3 chars of team name uppercase.
 */
export function resolveFlag(team: TeamData): FlagResult {
  const label = buildFallbackLabel(team);

  if (team.flagAsset) return { src: team.flagAsset, fallbackLabel: label };
  if (team.flagUrl) return { src: team.flagUrl, fallbackLabel: label };
  if (team.iso2) return { src: `/flags/${team.iso2.toLowerCase()}.svg`, fallbackLabel: label };

  return { src: null, fallbackLabel: label };
}

function buildFallbackLabel(team: TeamData): string {
  if (team.fifaCode) return team.fifaCode;
  const name = team.teamName ?? team.name ?? "";
  if (name.length >= 2) return name.slice(0, 3).toUpperCase();
  return "??";
}

// ── Dev warnings ──────────────────────────────────────

const missingFlagWarnings = new Set<string>();

export function warnMissingFlag(teamName: string, fifaCode?: string | null) {
  const runtime = globalThis as { process?: { env?: { NODE_ENV?: string } } };
  if (runtime.process?.env?.NODE_ENV === "production") return;
  const key = `${fifaCode ?? "unknown"}:${teamName}`;
  if (missingFlagWarnings.has(key)) return;
  missingFlagWarnings.add(key);
  console.warn(`[ui] Missing flag asset for ${teamName}${fifaCode ? ` (${fifaCode})` : ""} — fallback monogram will render.`);
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
