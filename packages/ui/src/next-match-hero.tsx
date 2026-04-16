import React from "react";
import type { NextMatchHeroProps } from "./types";
import { Button } from "./button";
import { Card } from "./card";
import { StatusTag } from "./status-tag";
import { TeamIdentity } from "./team";

export function NextMatchHero({
  awayTeam,
  ctaLabel,
  eyebrow,
  helperText,
  homeTeam,
  metaLabel,
  onAction,
  onSecondaryAction,
  secondaryCtaLabel,
  status,
  statusLabel,
  title
}: NextMatchHeroProps) {
  return (
    <Card
      elevated
      className={status === "locked" ? "hero-locked-bg" : "hero-editable-bg"}
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* ── Eyebrow + Status ── */}
      <div className="flex justify-between items-center px-5 pt-5 pb-0">
        <span className={`typo-eyebrow uppercase ${status === "locked" ? "text-gold" : "text-primary-500"}`}>
          {eyebrow}
        </span>
        <StatusTag status={status} label={statusLabel} />
      </div>

      {/* ── Matchup (centered duel) ── */}
      <div className="flex items-center justify-center gap-5 px-5 py-4">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamIdentity team={homeTeam} size="lg" emphasis="hero" align="center" />
        </div>
        <span className="text-[13px] font-bold tracking-[0.1em] text-text-muted shrink-0">VS</span>
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamIdentity team={awayTeam} size="lg" emphasis="hero" align="center" />
        </div>
      </div>

      {/* ── Meta + CTA ── */}
      <div className="grid gap-3 px-5 pb-5">
        <span className="typo-body text-text-secondary text-center">{metaLabel}</span>

        {helperText ? (
          <span className="typo-small text-text-muted text-center">{helperText}</span>
        ) : null}

        <Button fullWidth onClick={onAction}>
          {ctaLabel}
        </Button>

        {secondaryCtaLabel ? (
          <Button variant="ghost" fullWidth onClick={onSecondaryAction}>
            {secondaryCtaLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
