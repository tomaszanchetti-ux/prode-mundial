import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="app-body-bg">
        <LocaleProvider>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
