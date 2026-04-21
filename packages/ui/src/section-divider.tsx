import React from "react";

export type SectionDividerProps = {
  label?: string;
  variant?: "default" | "knockout" | "final";
};

export function SectionDivider({ label, variant = "default" }: SectionDividerProps) {
  return (
    <div className={`section-divider section-divider-${variant}`} role="separator">
      {label ? (
        <>
          <span className="section-divider-line" />
          <span className="section-divider-label">{label}</span>
          <span className="section-divider-line" />
        </>
      ) : (
        <span className="section-divider-line" />
      )}
    </div>
  );
}
