"use client";

import React from "react";
import { Card, StatusTag } from "@prode/ui";

export function GoldenBallCard() {
  return (
    <Card elevated style={{ padding: 14, gap: 10 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="typo-small text-text-muted">MI BALON DE ORO</span>
        </div>
        <StatusTag status="neutral" label="Mayo 2026" />
      </div>

      <span className="text-[14px] leading-[1.4] text-text-secondary">
        Elegi al mejor jugador del Mundial cuando FIFA publique el roster oficial.
      </span>
    </Card>
  );
}
