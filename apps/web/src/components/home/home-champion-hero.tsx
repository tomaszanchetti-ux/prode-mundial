import React from "react";
import type { TeamRef } from "@prode/shared";
import { Button, Card, TeamIdentity } from "@prode/ui";

type HomeChampionHeroProps = {
  champion: TeamRef | null;
  eyebrow: string;
  fallbackText: string;
  ctaLabel: string;
  onAction: () => void;
};

export function HomeChampionHero({
  champion,
  eyebrow,
  fallbackText,
  ctaLabel,
  onAction
}: HomeChampionHeroProps) {
  return (
    <Card elevated className="hero-locked-bg" style={{ padding: 0, overflow: "hidden" }}>
      <div className="flex justify-between items-center px-4 pt-4 pb-0">
        <span className="typo-eyebrow text-gold">{eyebrow}</span>
        <span className="typo-small text-gold" aria-hidden>
          ★
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-6">
        {champion ? (
          <TeamIdentity
            team={{
              teamName: champion.name,
              fifaCode: champion.fifaCode,
              flagAsset: champion.flagAsset,
              flagUrl: champion.flagUrl
            }}
            size="lg"
            emphasis="hero"
            align="center"
          />
        ) : (
          <span className="typo-h3 text-text-primary text-center">{fallbackText}</span>
        )}
      </div>

      <div className="grid gap-2 px-4 pb-4">
        <Button fullWidth onClick={onAction}>
          {ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
