"use client";

import React from "react";
import { SimpleTabs } from "@/components/ui/simple-tabs";

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
    <SimpleTabs
      items={items.map((item) => ({ key: item.key, label: item.label }))}
      activeTab={activeTab}
      onSelect={onSelect}
      ariaLabel="Predicciones"
    />
  );
}
