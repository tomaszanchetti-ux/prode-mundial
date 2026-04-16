import React from "react";
import type { ButtonProps } from "./types";

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-[18px] h-[18px] border-2 border-current border-t-transparent rounded-full"
      style={{ animation: "spin 600ms linear infinite" }}
    />
  );
}

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
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          <span>Guardando</span>
        </span>
      ) : children}
    </button>
  );
}
