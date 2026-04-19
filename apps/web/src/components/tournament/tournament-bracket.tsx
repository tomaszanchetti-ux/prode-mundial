"use client";

import React from "react";
import type {
  TournamentProjectionBracket,
  TournamentProjectionMatch,
  TournamentProjectionReadiness
} from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toLocalKickoffLabel } from "@/components/matches/matches-helpers";

type TournamentBracketProps = {
  bracket: TournamentProjectionBracket;
  readiness: TournamentProjectionReadiness;
  onOpenMatch: (matchId: string) => void;
  /**
   * When true (default), shows the "Complete your group predictions" banner
   * while `readiness.isGroupsComplete` is false. `/world-cup` passes false
   * because it reads the SOT directly — there are no user predictions to
   * complete, only official hydration pending.
   */
  showReadinessBanner?: boolean;
};

type RoundKey = "round32" | "round16" | "quarterfinals" | "semifinals" | "final";

type RoundColumnConfig = {
  key: RoundKey;
  label: string;
  matches: TournamentProjectionMatch[];
};

function BracketSide({
  side,
  isWinner,
  hasWinnerDecided
}: {
  side: TournamentProjectionMatch["home"];
  isWinner: boolean;
  hasWinnerDecided: boolean;
}) {
  const winnerClass = isWinner
    ? "text-text-primary font-semibold bg-primary/5 border-l-2 border-primary"
    : hasWinnerDecided
      ? "text-text-muted border-l-2 border-transparent"
      : "text-text-secondary border-l-2 border-transparent";

  if (side.team) {
    return (
      <div className={`flex items-center gap-2 min-w-0 rounded-sm pl-1.5 py-0.5 transition-colors ${winnerClass}`}>
        <TeamIdentity
          team={{
            teamName: side.team.name,
            fifaCode: side.team.fifaCode,
            flagAsset: side.team.flagAsset,
            flagUrl: side.team.flagUrl
          }}
          size="sm"
          showFlag
          showName
          emphasis="compact"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0 text-text-muted pl-1.5 py-0.5 border-l-2 border-transparent">
      <div className="w-5 h-5 rounded-full border border-dashed border-border-default" aria-hidden />
      <span className="text-[12px] leading-[1.3] truncate">{side.slotLabel}</span>
    </div>
  );
}

function MatchCard({
  match,
  kickoffLabel,
  onOpen,
  showConnector = false,
  accentTone = "neutral"
}: {
  match: TournamentProjectionMatch;
  kickoffLabel: string;
  onOpen: () => void;
  /** When true, draws a short horizontal line from the right edge into the next-column gap. */
  showConnector?: boolean;
  /** Visual accent for special-case cards (e.g. bronze = amber). */
  accentTone?: "neutral" | "bronze";
}) {
  const homeIsWinner = match.winnerTeamId !== null && match.winnerTeamId === match.home.team?.teamId;
  const awayIsWinner = match.winnerTeamId !== null && match.winnerTeamId === match.away.team?.teamId;
  const hasWinnerDecided = match.winnerTeamId !== null;

  const connectorClass = showConnector
    ? "after:content-[''] after:absolute after:top-1/2 after:right-0 after:h-px after:w-3 after:translate-x-full after:-translate-y-1/2 after:bg-border-default after:pointer-events-none"
    : "";
  const accentClass =
    accentTone === "bronze"
      ? "border-amber-500/40 hover:border-amber-500"
      : "border-border-default hover:border-primary/50";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative text-left rounded-lg border ${accentClass} bg-surface-default hover:bg-surface-raised hover:shadow-md transition-all p-2.5 cursor-pointer grid gap-1.5 w-full ${connectorClass}`.trim()}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] tracking-wide uppercase font-medium ${accentTone === "bronze" ? "text-amber-700 dark:text-amber-500" : "text-text-muted"}`}>
          {match.officialMatchNumber ? `M${match.officialMatchNumber}` : ""}
        </span>
        <span className="text-[10px] text-text-muted">{kickoffLabel}</span>
      </div>
      <div className="grid gap-1">
        <BracketSide side={match.home} isWinner={homeIsWinner} hasWinnerDecided={hasWinnerDecided} />
        <BracketSide side={match.away} isWinner={awayIsWinner} hasWinnerDecided={hasWinnerDecided} />
      </div>
    </button>
  );
}

function RoundLabel({ label }: { label: string }) {
  return (
    <span className="sticky top-0 z-[1] bg-surface-canvas py-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary border-b border-primary/20">
      {label}
    </span>
  );
}

function RoundColumn({
  label,
  matches,
  onOpenMatch,
  kickoffLabeler,
  isLastColumn = false
}: {
  label: string;
  matches: TournamentProjectionMatch[];
  onOpenMatch: (matchId: string) => void;
  kickoffLabeler: (iso: string) => string;
  isLastColumn?: boolean;
}) {
  const columnWidthClass = "min-w-[200px] md:min-w-[220px] lg:flex-1 lg:min-w-[260px]";

  if (matches.length === 0) {
    return (
      <div className={`flex flex-col gap-2 ${columnWidthClass}`}>
        <RoundLabel label={label} />
        <div className="flex-1 grid place-items-center py-4">
          <span className="text-[11px] text-text-muted">—</span>
        </div>
      </div>
    );
  }

  const sortedMatches = [...matches].sort(
    (left, right) => left.officialMatchNumber - right.officialMatchNumber
  );

  return (
    <div className={`flex flex-col gap-2 ${columnWidthClass}`}>
      <RoundLabel label={label} />
      <div className="flex-1 flex flex-col justify-around gap-2">
        {sortedMatches.map((match) => (
          <MatchCard
            key={match.matchId}
            match={match}
            kickoffLabel={kickoffLabeler(match.kickoffAt)}
            onOpen={() => onOpenMatch(match.matchId)}
            showConnector={!isLastColumn}
          />
        ))}
      </div>
    </div>
  );
}

export function TournamentBracket({
  bracket,
  readiness,
  onOpenMatch,
  showReadinessBanner = true
}: TournamentBracketProps) {
  const { locale } = useLocale();
  const kickoffLabeler = (iso: string) => toLocalKickoffLabel(iso, locale);

  const totalKnockoutMatches =
    bracket.round32.length +
    bracket.round16.length +
    bracket.quarterfinals.length +
    bracket.semifinals.length +
    bracket.bronze.length +
    bracket.final.length;

  if (totalKnockoutMatches === 0) {
    return (
      <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
        <span className="typo-small text-text-muted">BRACKET NO DISPONIBLE</span>
        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary max-w-[420px]">
          Todavía no podemos calcular tu bracket proyectado.
        </p>
      </Card>
    );
  }

  const columns: RoundColumnConfig[] = [
    { key: "round32", label: "16vos", matches: bracket.round32 },
    { key: "round16", label: "8vos", matches: bracket.round16 },
    { key: "quarterfinals", label: "QF", matches: bracket.quarterfinals },
    { key: "semifinals", label: "SF", matches: bracket.semifinals },
    { key: "final", label: "Final", matches: bracket.final }
  ];

  const bronzeMatch = bracket.bronze[0] ?? null;

  return (
    <div className="grid gap-3">
      {showReadinessBanner && !readiness.isGroupsComplete ? (
        <Card elevated style={{ gap: 6, padding: 12 }}>
          <span className="typo-small text-text-muted">BRACKET PROYECTADO</span>
          <p className="m-0 text-[13px] leading-[1.4] text-text-secondary">
            Completá los {readiness.groupMatchesTotal} partidos de grupos para ver tu bracket completo.
            Llevás <strong>{readiness.groupMatchesWithPrediction}/{readiness.groupMatchesTotal}</strong>.
          </p>
        </Card>
      ) : null}

      <div className="overflow-x-auto -mx-2 px-2">
        <section className="flex gap-3 lg:gap-6 xl:gap-10 min-w-max lg:min-w-0 items-stretch">
          {columns.map((column, index) => (
            <RoundColumn
              key={column.key}
              label={column.label}
              matches={column.matches}
              onOpenMatch={onOpenMatch}
              kickoffLabeler={kickoffLabeler}
              isLastColumn={index === columns.length - 1}
            />
          ))}
        </section>
      </div>

      {bronzeMatch ? (
        <section className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-500">
            Tercer puesto
          </span>
          <div className="max-w-[320px]">
            <MatchCard
              match={bronzeMatch}
              kickoffLabel={kickoffLabeler(bronzeMatch.kickoffAt)}
              onOpen={() => onOpenMatch(bronzeMatch.matchId)}
              accentTone="bronze"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
