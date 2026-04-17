import React from "react";
import { Card, StatusTag } from "@prode/ui";
import type { HighlightEntry } from "./leagues-helpers";

type HighlightsCardProps = {
  highlights: HighlightEntry[];
};

export function HighlightsCard({ highlights }: HighlightsCardProps) {
  if (highlights.length === 0) {
    return (
      <Card elevated style={{ gap: 8 }}>
        <span className="typo-small text-text-muted">HIGHLIGHTS</span>
        <p className="typo-body m-0 text-text-secondary">
          Cuando lleguen los primeros resultados vas a ver aqui donde ganaste ventaja.
        </p>
      </Card>
    );
  }

  return (
    <Card elevated style={{ gap: 10 }}>
      <span className="typo-small text-gold">DONDE GANASTE VENTAJA</span>
      <div className="grid gap-2">
        {highlights.map((entry) => (
          <div key={entry.matchId} className="flex items-center gap-3 p-3 surface-inset rounded-[12px]">
            <div className="grid gap-0.5 flex-1 min-w-0">
              <span className="text-[14px] leading-[1.3] text-text-primary font-semibold truncate">
                {entry.title}
              </span>
              <span className="text-[12px] leading-[1.3] text-text-muted truncate">
                {entry.subtitle}
              </span>
            </div>
            <StatusTag status="scored" label={`+${entry.points}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}
