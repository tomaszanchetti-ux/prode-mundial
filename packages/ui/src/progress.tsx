import React from "react";
import type { AdSlotCardProps, ProgressCompactProps, StatTone } from "./types";
import { Card } from "./card";

const toneValueClass: Record<StatTone, string> = {
  neutral: "text-text-primary",
  success: "text-[#16a34a]",
  primary: "text-[#2563eb]",
  warning: "text-[#d97706]"
};

const toneDotClass: Record<StatTone, string> = {
  neutral: "bg-text-muted",
  success: "bg-[#16a34a]",
  primary: "bg-[#2563eb]",
  warning: "bg-[#d97706]"
};

export function ProgressCompact({ items }: ProgressCompactProps) {
  return (
    <div className="grid grid-cols-3 gap-px surface-inset rounded-[var(--radius-md)] overflow-hidden">
      {items.map((item) => {
        const tone = item.tone ?? "neutral";
        return (
          <div key={item.label} className="flex flex-col items-center gap-1 py-3.5 px-2 bg-[var(--color-bg-surface)]">
            <strong className={`text-[28px] leading-none tracking-tight ${toneValueClass[tone]}`}>{item.value}</strong>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${toneDotClass[tone]}`} />
              <span className="typo-eyebrow text-text-muted">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdSlotCard({ description, title = "Publicidad" }: AdSlotCardProps) {
  return (
    <Card className="ad-slot-bg" style={{ gap: 4, padding: 12, minHeight: 88 }}>
      <div className="flex flex-col items-center justify-center gap-1 h-full text-center">
        <span className="typo-small text-text-muted uppercase tracking-widest">{title}</span>
        {description ? (
          <span className="text-[11px] leading-[1.3] text-text-muted max-w-[320px]">{description}</span>
        ) : null}
      </div>
    </Card>
  );
}
