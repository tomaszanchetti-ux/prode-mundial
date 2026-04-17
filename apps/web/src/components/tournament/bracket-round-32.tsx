"use client";

import React from "react";
import type { TournamentProjectionMatch, TournamentProjectionReadiness } from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toLocalKickoffLabel } from "@/components/matches/matches-helpers";

type BracketRound32Props = {
  matches: TournamentProjectionMatch[];
  readiness: TournamentProjectionReadiness;
  onOpenMatch: (matchId: string) => void;
};

function BracketSide({ side }: { side: TournamentProjectionMatch["home"] }) {
  if (side.team) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <TeamIdentity
          team={{
            teamName: side.team.name,
            fifaCode: side.team.fifaCode,
            flagAsset: side.team.flagAsset,
            flagUrl: side.team.flagUrl
          }}
          size="md"
          showFlag
          showName
          emphasis="compact"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0 text-text-muted">
      <div className="w-6 h-6 rounded-full border border-dashed border-border-default" aria-hidden />
      <span className="text-[13px] leading-[1.35] truncate">{side.slotLabel}</span>
    </div>
  );
}

export function BracketRound32({ matches, readiness, onOpenMatch }: BracketRound32Props) {
  const { locale } = useLocale();
  const sortedMatches = [...matches].sort((left, right) =>
    new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime()
  );

  if (sortedMatches.length === 0) {
    return (
      <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
        <span className="typo-small text-text-muted">BRACKET NO DISPONIBLE</span>
        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary max-w-[420px]">
          Todavía no podemos calcular tu bracket proyectado.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {!readiness.isGroupsComplete ? (
        <Card elevated style={{ gap: 6, padding: 12 }}>
          <span className="typo-small text-text-muted">BRACKET PROYECTADO</span>
          <p className="m-0 text-[13px] leading-[1.4] text-text-secondary">
            Completá los {readiness.groupMatchesTotal} partidos de grupos para ver tu bracket con los 32 clasificados.
            Llevás <strong>{readiness.groupMatchesWithPrediction}/{readiness.groupMatchesTotal}</strong>.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-[10px]">
        {sortedMatches.map((match) => (
          <button
            key={match.matchId}
            type="button"
            onClick={() => onOpenMatch(match.matchId)}
            className="text-left rounded-lg border border-border-default bg-surface-default hover:bg-surface-raised transition-colors p-3 cursor-pointer grid gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="typo-small text-text-muted">16vos</span>
              <span className="text-[12px] text-text-muted">{toLocalKickoffLabel(match.kickoffAt, locale)}</span>
            </div>
            <div className="grid gap-1.5">
              <BracketSide side={match.home} />
              <BracketSide side={match.away} />
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
