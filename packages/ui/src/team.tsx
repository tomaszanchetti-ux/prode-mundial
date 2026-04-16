import React from "react";
import type { TeamDisplayProps, TeamFlagProps, TeamIdentityRowProps } from "./types";
import {
  codeTextClasses,
  flagSizeClasses,
  flagSizes,
  getFlagFallback,
  resolveTeamFlagSrc,
  resolveTeamName,
  teamTextClasses,
  warnMissingFlag,
  weightClasses
} from "./helpers";

export function TeamFlag({ fifaCode, flagAsset, flagUrl, name, teamName, size = "md" }: TeamFlagProps) {
  const resolvedTeamName = resolveTeamName({ name, teamName });
  const fallback = getFlagFallback(resolvedTeamName);
  const flagSrc = resolveTeamFlagSrc({ flagAsset: flagAsset ?? null, flagUrl: flagUrl ?? null });
  const sizeClass = flagSizeClasses[size];

  if (!flagSrc) {
    warnMissingFlag(resolvedTeamName, fifaCode);
  }

  return (
    <>
      {flagSrc ? (
        <img
          src={flagSrc}
          alt=""
          width={flagSizes[size]}
          height={flagSizes[size]}
          className={`${sizeClass} rounded-pill object-cover border border-border-default shadow-[0_1px_3px_rgba(15,23,42,0.08)]`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${sizeClass} rounded-pill inline-flex items-center justify-center flag-fallback-bg text-text-primary border border-border-default text-[10px] font-bold`}
        >
          {fallback}
        </span>
      )}
    </>
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
  const resolvedTeamName = resolveTeamName({ name, teamName });

  return (
    <div className={`flex items-center gap-2.5 ${align === "center" ? "justify-center" : "justify-start"}`}>
      <TeamFlag fifaCode={fifaCode} flagAsset={flagAsset} flagUrl={flagUrl} name={name} teamName={teamName} size={size} />
      <div className="grid gap-[2px]">
        <span className={`${teamTextClasses[size]} leading-[1.2] text-text-primary ${weightClasses[weight]}`}>
          {resolvedTeamName}
        </span>
        {code ? <span className={`typo-small text-text-faint ${codeTextClasses[size]}`}>{code}</span> : null}
      </div>
    </div>
  );
}

export function TeamDisplay(props: TeamDisplayProps) {
  return <TeamIdentityRow {...props} />;
}
