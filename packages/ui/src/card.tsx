import React from "react";
import type { ElementType } from "react";
import type { CardProps, SectionHeaderProps } from "./types";

export function Card<T extends ElementType = "div">({
  as,
  children,
  className,
  elevated = false,
  style,
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      {...props}
      className={`card-base grid gap-3.5 p-4.5 ${elevated ? "card-elevated-bg" : ""} ${className ?? ""}`}
      style={style}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({ action, align = "start", description, eyebrow, title }: SectionHeaderProps) {
  return (
    <div className={`flex justify-between gap-3 flex-wrap ${align === "center" ? "items-center" : "items-end"}`}>
      <div className={`grid gap-2 ${align === "center" ? "text-center" : ""}`}>
        {eyebrow ? <span className="typo-eyebrow">{eyebrow}</span> : null}
        <div className="grid gap-[6px]">
          <h2 className="typo-h3 m-0 text-text-primary">{title}</h2>
          {description ? <p className="typo-body m-0 text-text-secondary">{description}</p> : null}
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
