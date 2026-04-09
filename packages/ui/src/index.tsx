import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return <div style={{ border: "1px solid #d9d9d9", borderRadius: 12, padding: 16 }}>{children}</div>;
}

