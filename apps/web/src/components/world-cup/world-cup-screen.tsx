"use client";

import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

export function WorldCupScreen() {
  const { locale } = useLocale();

  return (
    <section className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="text-lg font-bold tracking-tight">
          {copyForLocale(locale, "El Mundial", "World Cup")}
        </h1>
        <p className="text-sm text-text-muted">
          {copyForLocale(
            locale,
            "Sigue la copa real: resultados, clasificación y llaves.",
            "Follow the real tournament: results, standings and brackets."
          )}
        </p>
      </header>

      <div className="card-base grid gap-3 p-6 text-center" style={{ minHeight: 220 }}>
        <div className="mx-auto rounded-pill border border-border-default px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-text-muted">
          {copyForLocale(locale, "Próximamente", "Coming soon")}
        </div>
        <h2 className="text-base font-semibold">
          {copyForLocale(locale, "Estamos construyendo esta pantalla", "We're building this screen")}
        </h2>
        <p className="text-sm text-text-muted">
          {copyForLocale(
            locale,
            "Acá vas a poder ver el torneo real con resultados en vivo, grupos, llaves y el camino al campeón.",
            "Here you'll be able to see the real tournament with live results, groups, brackets and the road to the champion."
          )}
        </p>
      </div>
    </section>
  );
}
