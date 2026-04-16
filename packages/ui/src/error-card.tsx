import React from "react";
import { Button } from "./button";

type ErrorCardProps = {
  /** Short title — defaults to "Algo salio mal" */
  title?: string;
  /** Detail message */
  message: string;
  /** Retry callback — renders a retry button when provided */
  onRetry?: () => void;
  /** Retry label — defaults to "Reintentar" */
  retryLabel?: string;
};

export function ErrorCard({
  title = "Algo salio mal",
  message,
  onRetry,
  retryLabel = "Reintentar"
}: ErrorCardProps) {
  return (
    <div className="grid gap-2 p-4 rounded-[var(--radius-lg)] alert-error" style={{ animation: "fade-in 200ms ease-out" }}>
      <strong className="text-[15px] leading-[1.3]">{title}</strong>
      <p className="m-0 text-[14px] leading-[1.45]">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} style={{ marginTop: 4 }}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
