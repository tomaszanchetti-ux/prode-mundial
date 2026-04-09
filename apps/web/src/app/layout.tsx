import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { appBackgroundStyle } from "@prode/ui";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={appBackgroundStyle}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
