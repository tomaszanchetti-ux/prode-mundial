import React from "react";
import type { ReactNode } from "react";

type NotificationTone = "success" | "error" | "warning" | "info";

export type ToastProps = {
  tone: NotificationTone;
  children: ReactNode;
};

export type InlineNotificationProps = {
  tone: NotificationTone;
  children: ReactNode;
  className?: string;
};

export function Toast({ tone, children }: ToastProps) {
  return (
    <div className={`toast-base toast-${tone}`}>
      {children}
    </div>
  );
}

export function InlineNotification({ tone, children, className }: InlineNotificationProps) {
  return (
    <div className={`notification-base notification-${tone} ${className ?? ""}`}>
      {children}
    </div>
  );
}
