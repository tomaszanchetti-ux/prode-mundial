import React from "react";
import type {
  TeamData,
  TeamDisplayProps,
  TeamFlagProps,
  TeamIdentityEmphasis,
  TeamIdentityProps,
  TeamIdentityRowProps,
  TeamIdentitySize
} from "./types";
import {
  flagSizeClasses,
  flagSizes,
  resolveFlag,
  warnMissingFlag
} from "./helpers";

// ── Emphasis presets ─────────────────────────────────

const emphasisWeight: Record<TeamIdentityEmphasis, string> = {
  compact: "font-medium",
  default: "font-semibold",
  hero: "font-bold"
};

const emphasisGap: Record<TeamIdentityEmphasis, string> = {
  compact: "gap-2",
  default: "gap-2.5",
  hero: "gap-3"
};

const emphasisTextSize: Record<TeamIdentityEmphasis, Record<TeamIdentitySize, string>> = {
  compact: { sm: "text-[13px]", md: "text-[14px]", lg: "text-[16px]" },
  default: { sm: "text-[14px]", md: "text-[16px]", lg: "text-[18px]" },
  hero: { sm: "text-[15px]", md: "text-[17px]", lg: "text-[20px]" }
};

const emphasisCodeSize: Record<TeamIdentityEmphasis, string> = {
  compact: "text-[10px]",
  default: "text-[10px]",
  hero: "text-[11px]"
};

// ── TeamIdentity (primary API) ───────────────────────

export function TeamIdentity({
  team,
  size = "md",
  showFlag = true,
  showName = true,
  showCode = false,
  emphasis = "default",
  align = "start"
}: TeamIdentityProps) {
  const resolvedName = team.teamName ?? team.name ?? "Selección";
  const { src: flagSrc, fallbackLabel } = resolveFlag(team);

  if (showFlag && !flagSrc) {
    warnMissingFlag(resolvedName, team.fifaCode);
  }

  const showText = showName || showCode;

  return (
    <div className={`flex items-center ${emphasisGap[emphasis]} ${align === "center" ? "justify-center" : "justify-start"}`}>
      {showFlag ? (
        flagSrc ? (
          <img
            src={flagSrc}
            alt=""
            width={flagSizes[size]}
            height={flagSizes[size]}
            className={`${flagSizeClasses[size]} rounded-pill object-cover border border-border-default shadow-[0_1px_3px_rgba(15,23,42,0.08)]`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`${flagSizeClasses[size]} rounded-pill inline-flex items-center justify-center flag-fallback-bg text-text-primary border border-border-default text-[9px] font-bold tracking-tight`}
          >
            {fallbackLabel}
          </span>
        )
      ) : null}
      {showText ? (
        <div className="grid gap-[2px]">
          {showName ? (
            <span className={`${emphasisTextSize[emphasis][size]} leading-[1.2] text-text-primary ${emphasisWeight[emphasis]}`}>
              {resolvedName}
            </span>
          ) : null}
          {showCode && team.fifaCode ? (
            <span className={`typo-small text-text-faint ${emphasisCodeSize[emphasis]}`}>
              {team.fifaCode}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Legacy components (backward compat) ──────────────

const legacyWeightMap: Record<number, TeamIdentityEmphasis> = {
  500: "compact",
  600: "default",
  700: "hero"
};

export function TeamFlag({ fifaCode, flagAsset, flagUrl, name, teamName, size = "md" }: TeamFlagProps) {
  return (
    <TeamIdentity
      team={{ fifaCode, flagAsset, flagUrl, name, teamName }}
      size={size}
      showFlag
      showName={false}
      showCode={false}
    />
  );
}

export function TeamIdentityRow({
  align = "start",
  code,
  fifaCode,
  flagAsset,
  flagUrl,
  name,
  teamName,
  size = "md",
  weight = 600
}: TeamIdentityRowProps) {
  return (
    <TeamIdentity
      team={{ fifaCode, flagAsset, flagUrl, name, teamName }}
      size={size}
      showFlag
      showName
      showCode={!!code}
      emphasis={legacyWeightMap[weight] ?? "default"}
      align={align}
    />
  );
}

export function TeamDisplay(props: TeamDisplayProps) {
  return <TeamIdentityRow {...props} />;
}
