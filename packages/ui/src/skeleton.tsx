import React from "react";

type SkeletonProps = {
  /** Width — CSS value or Tailwind class via className */
  width?: string;
  /** Height — CSS value */
  height?: string;
  /** Use pill (full round) radius instead of default md */
  pill?: boolean;
  className?: string;
};

export function Skeleton({ width, height = "12px", pill, className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${pill ? "skeleton-pill" : ""} ${className}`.trim()}
      style={{ width, height }}
    />
  );
}

type SkeletonCardProps = {
  lines?: number;
  className?: string;
};

/** Pre-built card skeleton — mimics a typical card with N shimmer lines */
export function SkeletonCard({ lines = 3, className = "" }: SkeletonCardProps) {
  return (
    <div className={`card-base grid gap-2.5 p-4 ${className}`.trim()}>
      <Skeleton width="35%" height="10px" pill />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === 0 ? "60%" : "100%"}
          height={i === lines - 2 ? "56px" : "12px"}
          pill={i < lines - 2}
        />
      ))}
    </div>
  );
}

/** Match-card shaped skeleton */
export function SkeletonMatchCard() {
  return (
    <div className="card-base card-elevated-bg grid gap-2.5 p-3.5" style={{ minHeight: 88 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <Skeleton width="24px" height="24px" className="rounded-full" />
          <Skeleton width="40%" height="12px" pill />
        </div>
        <Skeleton width="32px" height="12px" pill />
        <div className="flex items-center gap-2.5 flex-1 justify-end">
          <Skeleton width="40%" height="12px" pill />
          <Skeleton width="24px" height="24px" className="rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton width="72px" height="10px" pill />
        <Skeleton width="56px" height="22px" pill />
      </div>
    </div>
  );
}

/** Standings row skeleton */
export function SkeletonStandingRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "var(--color-bg-surface)" }}>
      <Skeleton width="20px" height="20px" pill />
      <Skeleton width="24px" height="24px" className="rounded-full" />
      <Skeleton width="45%" height="12px" pill />
      <div className="ml-auto">
        <Skeleton width="32px" height="12px" pill />
      </div>
    </div>
  );
}
