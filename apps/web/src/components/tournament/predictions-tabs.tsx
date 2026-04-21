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
      className="predictions-tabs"
      role="tablist"
      aria-label="Predicciones"
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
            className={`predictions-tab ${isActive ? "predictions-tab--active" : ""}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
