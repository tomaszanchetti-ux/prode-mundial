"use client";

import React from "react";

export type TournamentPhase = "groups" | "bracket" | "r32" | "r16" | "qf" | "sf" | "final";

export type PhaseStatus = "scored" | "complete" | "partial" | "empty" | "locked";

export type PhaseTabItem = {
  phase: TournamentPhase;
  label: string;
  completed: number;
  total: number;
  status: PhaseStatus;
  isDisabled?: boolean;
  disabledReason?: string;
};

type PhaseTabsProps = {
  items: PhaseTabItem[];
  activePhase: TournamentPhase;
  onSelect: (phase: TournamentPhase) => void;
};

function toStatusDot(status: PhaseStatus) {
  if (status === "scored" || status === "complete") {
    return <span className="phase-tab-dot phase-tab-dot--complete" aria-hidden>✓</span>;
  }

  if (status === "partial") {
    return <span className="phase-tab-dot phase-tab-dot--partial" aria-hidden>•</span>;
  }

  if (status === "locked") {
    return <span className="phase-tab-dot phase-tab-dot--locked" aria-hidden>—</span>;
  }

  return <span className="phase-tab-dot phase-tab-dot--empty" aria-hidden>○</span>;
}

export function PhaseTabs({ items, activePhase, onSelect }: PhaseTabsProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto sticky top-0 z-[2] filter-bar-bg px-[2px]"
      role="tablist"
      aria-label="Fases del torneo"
    >
      {items.map((item) => {
        const isActive = item.phase === activePhase;
        const activeClass = item.status === "complete" || item.status === "scored"
          ? "filter-chip-active-saved"
          : "filter-chip-active";
        const disabledClass = item.isDisabled ? "opacity-60 cursor-not-allowed" : "";

        return (
          <button
            key={item.phase}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.isDisabled}
            aria-disabled={item.isDisabled}
            title={item.isDisabled ? item.disabledReason : undefined}
            onClick={() => {
              if (!item.isDisabled) {
                onSelect(item.phase);
              }
            }}
            className={`filter-chip whitespace-nowrap ${isActive ? activeClass : "filter-chip-inactive"} ${disabledClass}`.trim()}
          >
            <span className="inline-flex items-center gap-1.5">
              {toStatusDot(item.status)}
              <span>{item.label}</span>
              {!item.isDisabled && (
                <span className="typo-small text-text-muted">
                  {item.completed}/{item.total}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
