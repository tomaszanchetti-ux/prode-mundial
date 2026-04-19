"use client";

import React from "react";
import { Card, StatusTag } from "@prode/ui";

/**
 * Placeholder card for the Balón de Oro (EPIC 19).
 *
 * The roster pick can't be built until FIFA publishes the official 2026
 * roster (~15/05/2026). Until then we render a static "coming soon" card
 * so users understand the feature exists and where it'll surface.
 *
 * No backend, no state, no interactivity. When the roster lands we swap
 * this for a real SubChampionPickerCard-shaped component + an entity.
 */
export function GoldenBallCard() {
  return (
    <Card elevated style={{ padding: 14, gap: 10 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="typo-small text-text-muted">BALON DE ORO</span>
        </div>
        <StatusTag status="neutral" label="Proximamente" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] leading-[1.4] text-text-secondary">
          Elegi al mejor jugador del torneo cuando FIFA publique la lista oficial (mediados de mayo).
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
        <StatusTag status="neutral" label="Disponible ~15/05/2026" />
      </div>
    </Card>
  );
}
