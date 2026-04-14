import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { appBackgroundStyle } from "@prode/ui";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={appBackgroundStyle}>
        <LocaleProvider>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
