import type { ReactNode } from "react";

const bodyStyle = {
  margin: 0,
  minHeight: "100vh",
  fontFamily: "Georgia, Times New Roman, serif",
  background:
    "radial-gradient(circle at top, rgba(255, 209, 102, 0.18), transparent 30%), linear-gradient(180deg, #f6f5ef 0%, #eef1e5 100%)",
  color: "#102a13"
} as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={bodyStyle}>{children}</body>
    </html>
  );
}
