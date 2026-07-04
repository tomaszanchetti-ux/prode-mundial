"use client";

import React, { useMemo, useState } from "react";
import type { GlobalStandingsResponse } from "@prode/shared";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { filterGlobalStandingsByName, formatGlobalLeagueNames, toPositionColor, toStandingRowClass } from "./leagues-helpers";

type GlobalStandingsTableProps = {
  standings: GlobalStandingsResponse;
};

export function GlobalStandingsTable({ standings }: GlobalStandingsTableProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(
    () => filterGlobalStandingsByName(standings.items, query),
    [query, standings.items]
  );

  return (
    <div className="grid gap-2">
      <span className="typo-eyebrow">{t("RANKING GLOBAL", "GLOBAL RANKING")}</span>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("Buscar por nombre...", "Search by name...")}
        aria-label={t("Buscar jugador por nombre", "Search player by name")}
        className="email-input"
      />
      <div className="max-h-[min(420px,50vh)] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle,rgba(15,23,42,0.08))] bg-[var(--color-surface-elevated,#fff)]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface-elevated,#fff)]">
            <tr className="border-b border-[var(--color-border-subtle,rgba(15,23,42,0.08))]">
              <th className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-text-muted w-[42px]">
                #
              </th>
              <th className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-text-muted">
                {t("Jugador", "Player")}
              </th>
              <th className="px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-text-muted">
                {t("Liga", "League")}
              </th>
              <th className="px-2.5 py-2 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-text-muted w-[52px]">
                {t("Pts", "Pts")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((entry) => (
              <tr key={entry.userId} className={toStandingRowClass(entry)}>
                <td className={`px-2.5 py-2 text-[13px] font-bold tabular-nums ${toPositionColor(entry)}`}>
                  {entry.position}
                </td>
                <td className="px-2.5 py-2 min-w-0">
                  <span
                    className={`text-[14px] leading-[1.3] text-text-primary truncate block ${entry.isMe ? "font-bold" : "font-medium"}`}
                  >
                    {entry.displayName}
                    {entry.isMe ? ` (${t("tu", "you")})` : ""}
                  </span>
                  <span className="text-[11px] leading-[1.3] text-text-muted tabular-nums">
                    E{entry.exactHits} · S{entry.correctSigns} · M{entry.macroPoints}
                  </span>
                </td>
                <td className="px-2.5 py-2 min-w-0">
                  <span className="text-[12px] leading-[1.35] text-text-secondary truncate block">
                    {formatGlobalLeagueNames(entry.leagueNames)}
                  </span>
                </td>
                <td
                  className={`px-2.5 py-2 text-right text-[14px] font-bold tabular-nums ${
                    entry.isMe ? "text-primary-600" : entry.position === 1 ? "text-gold" : "text-text-primary"
                  }`}
                >
                  {entry.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 ? (
          <p className="typo-body m-0 px-2.5 py-4 text-text-secondary">
            {t("No encontramos jugadores con ese nombre.", "No players matched that name.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
