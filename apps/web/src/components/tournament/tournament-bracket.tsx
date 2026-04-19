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

type BracketHalf = "A" | "B" | "neutral";

type RoundKey = "round32" | "round16" | "quarterfinals" | "semifinals" | "final";

type RoundColumnConfig = {
  key: RoundKey;
  label: string;
  matches: TournamentProjectionMatch[];
};

/**
 * Classifies each match into bracket half A (route to SF1 = home-of-final) or
 * B (route to SF2 = away-of-final). Final and Bronze are cross-half (neutral).
 *
 * Starts from Final and walks upstream through "M{N}" references in slotLabels.
 * Fallback: all-neutral if topology can't be resolved.
 *
 * NOTE: does NOT reorder matches — that belongs to a future iteration where
 * we draw full "Y" connectors. For now cards stay in chronological order.
 */
function classifyBracketHalves(bracket: TournamentProjectionBracket): Map<string, BracketHalf> {
  const sideById = new Map<string, BracketHalf>();
  const byNumber = new Map<number, TournamentProjectionMatch>();
  for (const m of [
    ...bracket.round32,
    ...bracket.round16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...bracket.bronze,
    ...bracket.final
  ]) {
    if (typeof m.officialMatchNumber === "number") byNumber.set(m.officialMatchNumber, m);
  }

  const parseSrc = (label: string): number | null => {
    const m = /M(\d+)/.exec(label);
    return m ? Number.parseInt(m[1], 10) : null;
  };

  const finalMatch = bracket.final[0];
  if (!finalMatch) return sideById;

  const parentsOf = (match: TournamentProjectionMatch): TournamentProjectionMatch[] => {
    const h = parseSrc(match.home.slotLabel);
    const a = parseSrc(match.away.slotLabel);
    const out: TournamentProjectionMatch[] = [];
    if (h && byNumber.has(h)) out.push(byNumber.get(h)!);
    if (a && byNumber.has(a)) out.push(byNumber.get(a)!);
    return out;
  };

  const sfs = parentsOf(finalMatch);
  if (sfs.length === 2) {
    sideById.set(sfs[0].matchId, "A");
    sideById.set(sfs[1].matchId, "B");
  }

  const walkDown = (parents: TournamentProjectionMatch[]) => {
    const nextLevel: TournamentProjectionMatch[] = [];
    for (const parent of parents) {
      const side = sideById.get(parent.matchId) ?? "neutral";
      for (const child of parentsOf(parent)) {
        if (side !== "neutral") sideById.set(child.matchId, side);
        nextLevel.push(child);
      }
    }
    return nextLevel;
  };

  let level: TournamentProjectionMatch[] = sfs;
  for (let depth = 0; depth < 3 && level.length > 0; depth += 1) {
    level = walkDown(level);
  }

  sideById.set(finalMatch.matchId, "neutral");
  for (const b of bracket.bronze) sideById.set(b.matchId, "neutral");

  return sideById;
}

function BracketSideRow({
  side,
  isWinner,
  hasWinnerDecided
}: {
  side: TournamentProjectionMatch["home"];
  isWinner: boolean;
  hasWinnerDecided: boolean;
}) {
  const winnerClass = isWinner
    ? "text-primary-600 font-bold bg-primary-soft border-l-4 border-primary-500"
    : hasWinnerDecided
      ? "text-text-muted border-l-4 border-transparent opacity-70"
      : "text-text-primary border-l-4 border-transparent";

  if (side.team) {
    return (
      <div className={`flex items-center gap-2 min-w-0 rounded-sm pl-2 py-1 transition-colors ${winnerClass}`}>
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
    <div className="flex items-center gap-2 min-w-0 text-text-muted pl-2 py-1 border-l-4 border-transparent">
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
  bracketHalf = "neutral",
  accentTone = "neutral"
}: {
  match: TournamentProjectionMatch;
  kickoffLabel: string;
  onOpen: () => void;
  /** Short horizontal line from the right edge into the next-column gap. */
  showConnector?: boolean;
  /** Which half of the bracket this match feeds. */
  bracketHalf?: BracketHalf;
  /** Visual accent for special-case cards (e.g. bronze = gold). */
  accentTone?: "neutral" | "bronze";
}) {
  const homeIsWinner = match.winnerTeamId !== null && match.winnerTeamId === match.home.team?.teamId;
  const awayIsWinner = match.winnerTeamId !== null && match.winnerTeamId === match.away.team?.teamId;
  const hasWinnerDecided = match.winnerTeamId !== null;

  const connectorClass = showConnector
    ? "after:content-[''] after:absolute after:top-1/2 after:right-0 after:h-[2px] after:w-6 md:after:w-10 lg:after:w-14 xl:after:w-20 after:translate-x-full after:-translate-y-1/2 after:bg-primary-500 after:pointer-events-none"
    : "";

  const sideBgClass =
    accentTone === "bronze"
      ? "bg-surface-raised"
      : bracketHalf === "A"
        ? "bg-[#E6EEFB]"
        : bracketHalf === "B"
          ? "bg-[#EEEBF7]"
          : "bg-surface-raised";

  const accentClass =
    accentTone === "bronze"
      ? "border-gold hover:border-gold"
      : "border-border-strong hover:border-primary-500";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative text-left rounded-lg border-2 ${accentClass} ${sideBgClass} shadow-card hover:shadow-modal transition-all p-3 cursor-pointer grid gap-2 w-full ${connectorClass}`.trim()}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
            accentTone === "bronze" ? "bg-gold-soft text-gold" : "bg-primary-soft text-primary-600"
          }`}
        >
          {match.officialMatchNumber ? `M${match.officialMatchNumber}` : "—"}
        </span>
        <span className="text-[10px] text-text-muted tabular-nums">{kickoffLabel}</span>
      </div>
      <div className="grid gap-1">
        <BracketSideRow side={match.home} isWinner={homeIsWinner} hasWinnerDecided={hasWinnerDecided} />
        <BracketSideRow side={match.away} isWinner={awayIsWinner} hasWinnerDecided={hasWinnerDecided} />
      </div>
    </button>
  );
}

function RoundLabel({ label, tone = "primary" }: { label: string; tone?: "primary" | "gold" }) {
  const toneClass = tone === "gold" ? "bg-gold text-white" : "bg-primary-500 text-white";
  return (
    <div className="sticky top-0 z-[1] bg-bg-main py-1.5 flex justify-center">
      <span
        className={`inline-block px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-widest shadow-card ${toneClass}`}
      >
        {label}
      </span>
    </div>
  );
}

function RoundColumn({
  label,
  matches,
  sideById,
  onOpenMatch,
  kickoffLabeler,
  isLastColumn = false
}: {
  label: string;
  matches: TournamentProjectionMatch[];
  sideById: Map<string, BracketHalf>;
  onOpenMatch: (matchId: string) => void;
  kickoffLabeler: (iso: string) => string;
  isLastColumn?: boolean;
}) {
  const columnWidthClass = "min-w-[180px] md:min-w-[200px] lg:flex-1 lg:min-w-0";

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
    (left, right) => (left.officialMatchNumber ?? 0) - (right.officialMatchNumber ?? 0)
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
            bracketHalf={sideById.get(match.matchId) ?? "neutral"}
          />
        ))}
      </div>
    </div>
  );
}

function BracketLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-text-secondary">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-[#E6EEFB] border border-border-strong" aria-hidden />
        Llave A
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-[#EEEBF7] border border-border-strong" aria-hidden />
        Llave B
      </span>
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

  const sideById = classifyBracketHalves(bracket);

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

      <BracketLegend />

      <div className="overflow-x-auto lg:overflow-visible -mx-2 px-2 pb-1">
        <section className="flex gap-3 lg:gap-6 xl:gap-8 min-w-max lg:min-w-0 items-stretch">
          {columns.map((column, index) => (
            <RoundColumn
              key={column.key}
              label={column.label}
              matches={column.matches}
              sideById={sideById}
              onOpenMatch={onOpenMatch}
              kickoffLabeler={kickoffLabeler}
              isLastColumn={index === columns.length - 1}
            />
          ))}
        </section>
      </div>

      {bronzeMatch ? (
        <section className="grid gap-2 justify-items-start">
          <span className="inline-block bg-gold-soft text-gold px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-widest">
            Tercer puesto
          </span>
          <div className="w-full max-w-[320px]">
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
