"use client";

import { Button } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: 4,
        borderRadius: 999,
        background: "var(--color-bg-interactive)",
        border: "1px solid var(--color-border-default)"
      }}
    >
      <Button
        type="button"
        variant={locale === "es" ? "secondary" : "ghost"}
        aria-pressed={locale === "es"}
        style={{ minHeight: 30, padding: "0 10px", borderRadius: 999, fontSize: 12 }}
        onClick={() => setLocale("es")}
      >
        ESP
      </Button>
      <Button
        type="button"
        variant={locale === "en" ? "secondary" : "ghost"}
        aria-pressed={locale === "en"}
        style={{ minHeight: 30, padding: "0 10px", borderRadius: 999, fontSize: 12 }}
        onClick={() => setLocale("en")}
      >
        ENG
      </Button>
    </div>
  );
}
