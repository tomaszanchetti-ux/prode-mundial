import React from "react";
import { Button, Card } from "@prode/ui";

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
    <Card style={{ gap: 10, padding: 16 }}>
      <div className="w-[124px] h-[10px] rounded-full bg-bg-interactive" />
      <div className="w-[72%] h-[14px] rounded-full bg-bg-muted" />
      <div className="w-full h-[72px] rounded-[16px] bg-bg-muted" />
    </Card>
  );
}
