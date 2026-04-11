"use client";

import { Button } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant={locale === "es" ? "primary" : "ghost"} style={{ minHeight: 36, padding: "0 12px" }} onClick={() => setLocale("es")}>
        ESP
      </Button>
      <Button variant={locale === "en" ? "primary" : "ghost"} style={{ minHeight: 36, padding: "0 12px" }} onClick={() => setLocale("en")}>
        ENG
      </Button>
    </div>
  );
}
