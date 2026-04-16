import React from "react";
import type { AdSlotCardProps, ProgressCompactProps } from "./types";
import { Card } from "./card";

export function ProgressCompact({ items }: ProgressCompactProps) {
  return (
    <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
      {items.map((item) => (
        <div key={item.label} className="surface-inset grid gap-[6px] p-3.5">
          <span className="typo-small text-text-muted">{item.label}</span>
          <strong className="text-[24px] leading-none text-text-primary">{item.value}</strong>
          <span className="text-[13px] leading-[1.35] text-text-secondary">{item.hint}</span>
        </div>
      ))}
    </div>
  );
}

export function AdSlotCard({ description, title = "Publicidad" }: AdSlotCardProps) {
  return (
    <Card className="ad-slot-bg" style={{ gap: 8, padding: 16 }}>
      <span className="typo-small text-text-muted">{title}</span>
      <p className="typo-body m-0 text-text-secondary">{description}</p>
    </Card>
  );
}
