import React from "react";
import type { StatusTagProps } from "./types";

export function StatusTag({ status, label }: StatusTagProps) {
  return (
    <span className={`status-tag status-${status}`}>
      {label ?? status}
    </span>
  );
}
