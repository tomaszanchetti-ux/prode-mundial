import React from "react";
import type { ButtonProps } from "./types";

export function Button({
  children,
  disabled = false,
  fullWidth = false,
  loading = false,
  style,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`btn-base btn-${variant} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={style}
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}
