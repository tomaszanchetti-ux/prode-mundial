import React from "react";
import type { NextMatchHeroProps } from "./types";
import { Card } from "./card";
import { StatusTag } from "./status-tag";
import { TeamIdentity } from "./team";

export function NextMatchHero({
  awayTeam,
  disabled,
  eyebrow,
  helperText,
  homeTeam,
  metaLabel,
  onAction,
  score,
  status,
  statusLabel,
  title
}: NextMatchHeroProps) {
  const isActionable = status === "editable" || status === "saved" || status === "closing-soon";
  const eyebrowTone =
    status === "saved"
      ? "text-success"
      : status === "editable"
        ? "text-primary-500"
        : status === "closing-soon"
          ? "text-gold"
          : "text-text-muted";
  const glowClass = status === "editable" ? "ring-2 ring-primary-500/30" : "";
  const bgClass = isActionable ? "hero-editable-bg" : "hero-locked-bg";

  return (
    <Card
      as="button"
      type="button"
      elevated
      onClick={onAction}
      disabled={disabled}
      aria-label={title}
      className={`text-left w-full cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-shadow ${bgClass} ${glowClass}`}
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* ── Eyebrow + Status ── */}
      <div className="flex justify-between items-center px-4 pt-4 pb-0">
        <span className={`typo-eyebrow uppercase ${eyebrowTone}`}>{eyebrow}</span>
        <StatusTag status={status} label={statusLabel} />
      </div>

      {/* ── Matchup (centered duel with scoreboard) ── */}
      <div className="flex items-center justify-center gap-4 px-4 py-4">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <TeamIdentity team={homeTeam} size="lg" emphasis="hero" align="center" />
        </div>
        {score ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[36px] leading-none font-black tracking-tight text-text-primary tabular-nums">{score.home}</span>
            <span className="text-[24px] leading-none font-light text-text-muted">–</span>
            <span className="text-[36px] leading-none font-black tracking-tight text-text-primary tabular-nums">{score.away}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[36px] leading-none font-black tracking-tight text-text-muted tabular-nums">–</span>
            <span className="text-[24px] leading-none font-light text-text-muted opacity-0">–</span>
            <span className="text-[36px] leading-none font-black tracking-tight text-text-muted tabular-nums">–</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <TeamIdentity team={awayTeam} size="lg" emphasis="hero" align="center" />
        </div>
      </div>

      {/* ── Meta footer ── */}
      {metaLabel || helperText ? (
        <div className="grid gap-1 px-4 pb-4">
          {metaLabel ? (
            <span className="typo-body text-text-secondary text-center">{metaLabel}</span>
          ) : null}
          {helperText ? (
            <span className="typo-meta text-center">{helperText}</span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
