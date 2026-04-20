import React from "react";
import type { NextMatchHeroProps } from "./types";
import { Button } from "./button";
import { Card } from "./card";
import { StatusTag } from "./status-tag";
import { TeamIdentity } from "./team";

export function NextMatchHero({
  awayTeam,
  ctaDisabled,
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
  const isActionable = status === "editable" || status === "saved" || status === "closing-soon";
  const eyebrowTone =
    status === "saved"
      ? "text-success"
      : status === "editable"
        ? "text-primary-500"
        : status === "closing-soon"
          ? "text-gold"
          : "text-text-muted";

  return (
    <Card
      elevated
      className={isActionable ? "hero-editable-bg" : "hero-locked-bg"}
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* ── Eyebrow + Status ── */}
      <div className="flex justify-between items-center px-4 pt-4 pb-0">
        <span className={`typo-eyebrow uppercase ${eyebrowTone}`}>{eyebrow}</span>
        <StatusTag status={status} label={statusLabel} />
      </div>

      {/* ── Matchup (centered duel) ── */}
      <div className="flex items-center justify-center gap-5 px-4 py-4">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <TeamIdentity team={homeTeam} size="lg" emphasis="hero" align="center" />
        </div>
        <span className="text-[18px] font-black tracking-[0.14em] text-text-muted shrink-0">VS</span>
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <TeamIdentity team={awayTeam} size="lg" emphasis="hero" align="center" />
        </div>
      </div>

      {/* ── Meta + CTA ── */}
      <div className="grid gap-2 px-4 pb-4">
        {metaLabel ? (
          <span className="typo-body text-text-secondary text-center">{metaLabel}</span>
        ) : null}

        {helperText ? (
          <span className="typo-small text-text-muted text-center">{helperText}</span>
        ) : null}

        <Button fullWidth onClick={onAction} disabled={ctaDisabled}>
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
