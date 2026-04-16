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
      style={{ gap: 12, padding: 16 }}
    >
      <div className="flex justify-between gap-3 items-start flex-wrap">
        <div className="grid gap-1">
          <span className={`typo-small ${status === "locked" ? "text-gold" : "text-primary-500"}`}>{eyebrow}</span>
          <h2 className="typo-h2 m-0 text-text-primary">{title}</h2>
          <span className="typo-body text-text-secondary">{metaLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div className="grid gap-3">
        <TeamIdentity team={homeTeam} size="lg" emphasis="hero" />
        <div className="pl-[44px] text-[12px] text-text-muted font-bold tracking-[0.08em]">VS</div>
        <TeamIdentity team={awayTeam} size="lg" emphasis="hero" />
      </div>

      {helperText ? (
        <div className="surface-inset grid gap-3 p-3.5">
          <span className="typo-body text-text-primary font-semibold">{helperText}</span>
        </div>
      ) : null}

      <div className="flex gap-2.5 flex-wrap">
        <Button fullWidth={!secondaryCtaLabel} onClick={onAction}>
          {ctaLabel}
        </Button>
        {secondaryCtaLabel ? (
          <Button variant="ghost" onClick={onSecondaryAction}>
            {secondaryCtaLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
