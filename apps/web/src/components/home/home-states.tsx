import React from "react";
import { Button, Card, Skeleton, SkeletonMatchCard } from "@prode/ui";

type HomeErrorCardProps = {
  message: string;
  onRetry: () => void;
};

export function HomeErrorCard({ message, onRetry }: HomeErrorCardProps) {
  return (
    <Card className="alert-error" style={{ gap: 8, padding: 16 }}>
      <strong className="text-[16px]">No pudimos cargar tu home</strong>
      <p className="m-0 text-[14px] leading-[1.45]">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    </Card>
  );
}

export function HomeSkeletonCard() {
  return (
    <div className="grid gap-4">
      {/* Hero skeleton */}
      <div className="card-base grid gap-3 p-4" style={{ minHeight: 160 }}>
        <Skeleton width="80px" height="10px" pill />
        <div className="flex items-center justify-center gap-6 py-4">
          <Skeleton width="56px" height="56px" className="rounded-full" />
          <Skeleton width="32px" height="18px" pill />
          <Skeleton width="56px" height="56px" className="rounded-full" />
        </div>
        <Skeleton width="100%" height="46px" />
      </div>
      {/* Upcoming matches */}
      <SkeletonMatchCard />
      <SkeletonMatchCard />
    </div>
  );
}
