"use client";

import React from "react";

export type PredictionsTab = "matches" | "knockouts";

export type PredictionsTabItem = {
  key: PredictionsTab;
  label: string;
  completed: number;
  total: number;
};

type PredictionsTabsProps = {
  items: PredictionsTabItem[];
  activeTab: PredictionsTab;
  onSelect: (tab: PredictionsTab) => void;
};

export function PredictionsTabs({ items, activeTab, onSelect }: PredictionsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Predicciones"
      className="flex gap-6 border-b border-border-default px-1"
    >
      {items.map((item) => {
        const isActive = item.key === activeTab;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(item.key)}
            className={`relative py-2.5 text-[15px] font-semibold bg-transparent border-0 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-sm active:opacity-70 ${
              isActive ? "text-primary-600" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {item.label}
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-px h-[2px] rounded-[2px] bg-primary-500"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
