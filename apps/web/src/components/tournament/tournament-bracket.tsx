"use client";

import React, { useCallback, useEffect, useRef } from "react";
import type {
  TournamentProjectionBracket,
  TournamentProjectionMatch,
  TournamentProjectionReadiness
} from "@prode/shared";
import { buildCompactSlotLabel } from "@prode/shared";
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

const ROUND_ORDER: RoundKey[] = ["round32", "round16", "quarterfinals", "semifinals", "final"];

const ROUND_LABEL: Record<RoundKey, string> = {
  round32: "16avos",
  round16: "8vos",
  quarterfinals: "QF",
  semifinals: "SF",
  final: "Final"
};

const STAGE_TO_ROUND: Record<string, RoundKey> = {
  R32: "round32",
  R16: "round16",
  QF: "quarterfinals",
  SF: "semifinals",
  FINAL: "final"
};

function parseSrc(label: string): number | null {
  const m = /M(\d+)/.exec(label);
  return m ? Number.parseInt(m[1], 10) : null;
}

function buildByNumber(bracket: TournamentProjectionBracket): Map<number, TournamentProjectionMatch> {
  const map = new Map<number, TournamentProjectionMatch>();
  const all = [
    ...bracket.round32,
    ...bracket.round16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...bracket.bronze,
    ...bracket.final
  ];
  for (const m of all) {
    if (typeof m.officialMatchNumber === "number") {
      map.set(m.officialMatchNumber, m);
    }
  }
  return map;
}

function parentsOf(
  match: TournamentProjectionMatch,
  byNumber: Map<number, TournamentProjectionMatch>
): TournamentProjectionMatch[] {
  const out: TournamentProjectionMatch[] = [];
  const h = parseSrc(match.home.slotLabel);
  if (h !== null) {
    const p = byNumber.get(h);
    if (p) out.push(p);
  }
  const a = parseSrc(match.away.slotLabel);
  if (a !== null) {
    const p = byNumber.get(a);
    if (p) out.push(p);
  }
  return out;
}

/**
 * Classifies each knock-out match into bracket half A (route to SF1 =
 * home-of-final) or B (route to SF2 = away-of-final). Final and Bronze are
 * cross-half (neutral).
 *
 * Starts from Final and walks upstream through "M{N}" references in
 * slotLabels. Fallback: all-neutral if topology can't be resolved.
 */
function classifyBracketHalves(bracket: TournamentProjectionBracket): Map<string, BracketHalf> {
  const sideById = new Map<string, BracketHalf>();
  const byNumber = buildByNumber(bracket);

  const finalMatch = bracket.final[0];
  if (!finalMatch) return sideById;

  const sfs = parentsOf(finalMatch, byNumber);
  if (sfs.length === 2) {
    sideById.set(sfs[0].matchId, "A");
    sideById.set(sfs[1].matchId, "B");
  }

  const walkDown = (parents: TournamentProjectionMatch[]) => {
    const nextLevel: TournamentProjectionMatch[] = [];
    for (const parent of parents) {
      const side = sideById.get(parent.matchId) ?? "neutral";
      for (const child of parentsOf(parent, byNumber)) {
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

/**
 * DFS from the Final backwards: orders each round so that siblings feeding the
 * same parent match are **adjacent**. That adjacency is what makes the Y
 * connectors line up without having to measure DOM positions.
 *
 * Per-round fallback: if DFS can't populate a round fully (e.g. partially
 * hydrated bracket, no Final yet), fall back to officialMatchNumber order so
 * the column still renders sensibly.
 */
function resolveBracketOrder(
  bracket: TournamentProjectionBracket
): Record<RoundKey, TournamentProjectionMatch[]> {
  const byNumber = buildByNumber(bracket);
  const dfs: Record<RoundKey, TournamentProjectionMatch[]> = {
    round32: [],
    round16: [],
    quarterfinals: [],
    semifinals: [],
    final: []
  };

  const pushUnique = (match: TournamentProjectionMatch, key: RoundKey) => {
    if (!dfs[key].some((m) => m.matchId === match.matchId)) dfs[key].push(match);
  };

  const walk = (match: TournamentProjectionMatch) => {
    for (const parent of parentsOf(match, byNumber)) {
      const key = STAGE_TO_ROUND[parent.stage];
      if (!key) continue;
      pushUnique(parent, key);
      walk(parent);
    }
  };

  const finalMatch = bracket.final[0];
  if (finalMatch) {
    pushUnique(finalMatch, "final");
    walk(finalMatch);
  }

  const byNum = (a: TournamentProjectionMatch, b: TournamentProjectionMatch) =>
    a.officialMatchNumber - b.officialMatchNumber;

  const sources: Record<RoundKey, TournamentProjectionMatch[]> = {
    round32: bracket.round32,
    round16: bracket.round16,
    quarterfinals: bracket.quarterfinals,
    semifinals: bracket.semifinals,
    final: bracket.final
  };

  const result = {} as Record<RoundKey, TournamentProjectionMatch[]>;
  for (const key of ROUND_ORDER) {
    const source = sources[key];
    result[key] =
      dfs[key].length === source.length && source.length > 0
        ? dfs[key]
        : [...source].sort(byNum);
  }
  return result;
}

function chunkIntoPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
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
      <div className={`flex items-center gap-1.5 min-w-0 rounded-sm pl-1.5 py-0.5 transition-colors ${winnerClass}`}>
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
    <div className="flex items-center gap-1.5 min-w-0 text-text-muted pl-1.5 py-0.5 border-l-4 border-transparent">
      <div className="w-4 h-4 rounded-full border border-dashed border-border-default" aria-hidden />
      <span className="text-[11px] leading-[1.25] truncate tabular-nums font-semibold">{buildCompactSlotLabel(side.slot)}</span>
    </div>
  );
}

function MatchCard({
  match,
  kickoffLabel,
  onOpen,
  bracketHalf = "neutral",
  accentTone = "neutral"
}: {
  match: TournamentProjectionMatch;
  kickoffLabel: string;
  onOpen: () => void;
  /** Which half of the bracket this match feeds. */
  bracketHalf?: BracketHalf;
  /** Visual accent for special-case cards (e.g. bronze = gold). */
  accentTone?: "neutral" | "bronze";
}) {
  const homeIsWinner = match.winnerTeamId !== null && match.winnerTeamId === match.home.team?.teamId;
  const awayIsWinner = match.winnerTeamId !== null && match.winnerTeamId === match.away.team?.teamId;
  const hasWinnerDecided = match.winnerTeamId !== null;

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
      className={`relative z-[1] text-left rounded-lg border-2 ${accentClass} ${sideBgClass} shadow-card hover:shadow-modal transition-all px-2 py-2 cursor-pointer grid gap-1.5 w-full`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[9px] font-bold font-mono px-1 py-0.5 rounded leading-none ${
            accentTone === "bronze" ? "bg-gold-soft text-gold" : "bg-primary-soft text-primary-600"
          }`}
        >
          {match.officialMatchNumber ? `M${match.officialMatchNumber}` : "—"}
        </span>
        <span className="text-[9px] text-text-muted tabular-nums leading-none">{kickoffLabel}</span>
      </div>
      <div className="grid gap-0.5">
        <BracketSideRow side={match.home} isWinner={homeIsWinner} hasWinnerDecided={hasWinnerDecided} />
        <BracketSideRow side={match.away} isWinner={awayIsWinner} hasWinnerDecided={hasWinnerDecided} />
      </div>
    </button>
  );
}

function RoundLabel({
  label,
  tone = "primary"
}: {
  label: string;
  tone?: "tenue" | "primary" | "strong" | "gold";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-gold text-white"
      : tone === "tenue"
        ? "bg-primary-soft text-primary-600"
        : tone === "strong"
          ? "bg-primary-700 text-white"
          : "bg-primary-500 text-white";
  return (
    <div className="sticky top-0 z-[2] bg-bg-main py-1.5 flex justify-center">
      <span
        className={`inline-block px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-widest shadow-card ${toneClass}`}
      >
        {label}
      </span>
    </div>
  );
}

const ROUND_TONE: Record<RoundKey, "tenue" | "primary" | "strong"> = {
  round32: "tenue",
  round16: "tenue",
  quarterfinals: "primary",
  semifinals: "primary",
  final: "strong"
};

/**
 * Pair wrapper: contains two sibling matches that feed the same child in the
 * next round. Uses `flex: 1 1 0` + `justify-around` so the two cards sit at
 * 25% / 75% of the wrapper height. The Y connector is drawn by the
 * `.bracket-pair` pseudo-elements defined in globals.css:
 *   - ::before = the `]` shape (top + right + bottom borders) spanning 25%→75%
 *   - ::after  = a horizontal tail from the midpoint into the next column
 *
 * Because pair-midpoint in round N equals card-center in round N+1 (both
 * evaluate to (i+0.5)·H/N_pairs), the tail lands exactly on the child card's
 * vertical center — no measurement needed.
 */
function PairGroup({
  matches,
  sideById,
  onOpenMatch,
  kickoffLabeler,
  drawConnector
}: {
  matches: TournamentProjectionMatch[];
  sideById: Map<string, BracketHalf>;
  onOpenMatch: (matchId: string) => void;
  kickoffLabeler: (iso: string) => string;
  drawConnector: boolean;
}) {
  const showConnector = drawConnector && matches.length === 2;
  const halfA = sideById.get(matches[0]?.matchId ?? "") ?? "neutral";
  const halfB = sideById.get(matches[1]?.matchId ?? "") ?? "neutral";
  const pairHalf: BracketHalf = halfA === halfB ? halfA : "neutral";
  const connectorClass = showConnector
    ? pairHalf === "A"
      ? "bracket-pair bracket-pair--a"
      : pairHalf === "B"
        ? "bracket-pair bracket-pair--b"
        : "bracket-pair"
    : "";
  return (
    <div
      className={`relative flex flex-col justify-around flex-1 min-h-0 ${connectorClass}`.trim()}
    >
      {matches.map((match) => (
        <MatchCard
          key={match.matchId}
          match={match}
          kickoffLabel={kickoffLabeler(match.kickoffAt)}
          onOpen={() => onOpenMatch(match.matchId)}
          bracketHalf={sideById.get(match.matchId) ?? "neutral"}
        />
      ))}
    </div>
  );
}

function RoundColumn({
  roundKey,
  matches,
  sideById,
  onOpenMatch,
  kickoffLabeler,
  hasNextRound
}: {
  roundKey: RoundKey;
  matches: TournamentProjectionMatch[];
  sideById: Map<string, BracketHalf>;
  onOpenMatch: (matchId: string) => void;
  kickoffLabeler: (iso: string) => string;
  hasNextRound: boolean;
}) {
  const label = ROUND_LABEL[roundKey];
  const tone = ROUND_TONE[roundKey];
  const columnWidthClass = "min-w-[180px] md:min-w-[200px] lg:flex-1 lg:min-w-0";

  if (matches.length === 0) {
    return (
      <div className={`flex flex-col gap-2 ${columnWidthClass}`}>
        <RoundLabel label={label} tone={tone} />
        <div className="flex-1 grid place-items-center py-4">
          <span className="text-[11px] text-text-muted">—</span>
        </div>
      </div>
    );
  }

  // Final: single card, no pair grouping.
  if (roundKey === "final") {
    const match = matches[0];
    return (
      <div className={`flex flex-col gap-2 ${columnWidthClass}`}>
        <RoundLabel label={label} tone={tone} />
        <div className="flex-1 flex flex-col justify-around">
          <MatchCard
            match={match}
            kickoffLabel={kickoffLabeler(match.kickoffAt)}
            onOpen={() => onOpenMatch(match.matchId)}
            bracketHalf={sideById.get(match.matchId) ?? "neutral"}
          />
        </div>
      </div>
    );
  }

  const pairs = chunkIntoPairs(matches);

  return (
    <div className={`flex flex-col gap-2 ${columnWidthClass}`}>
      <RoundLabel label={label} tone={tone} />
      <div className="flex-1 flex flex-col">
        {pairs.map((pair, idx) => (
          <PairGroup
            key={pair.map((m) => m.matchId).join("-") || `pair-${idx}`}
            matches={pair}
            sideById={sideById}
            onOpenMatch={onOpenMatch}
            kickoffLabeler={kickoffLabeler}
            drawConnector={hasNextRound}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Wraps the horizontal scroll container and renders edge fade affordances
 * via data attributes read by `.bracket-scroll-wrap` in globals.css.
 * Updates `data-scroll-start` / `data-scroll-end` on scroll + resize so the
 * gradients hide at the extremes — signaling "this is the end" without a
 * visible scrollbar.
 */
function BracketScrollWrap({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const updateScrollEdges = useCallback(() => {
    const scroller = scrollRef.current;
    const wrap = wrapRef.current;
    if (!scroller || !wrap) return;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const atStart = scroller.scrollLeft <= 1;
    const atEnd = maxScroll <= 1 || scroller.scrollLeft >= maxScroll - 1;
    wrap.dataset.scrollStart = atStart ? "true" : "false";
    wrap.dataset.scrollEnd = atEnd ? "true" : "false";
  }, []);

  useEffect(() => {
    updateScrollEdges();
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.addEventListener("scroll", updateScrollEdges, { passive: true });
    const ro = new ResizeObserver(updateScrollEdges);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", updateScrollEdges);
      ro.disconnect();
    };
  }, [updateScrollEdges]);

  return (
    <div ref={wrapRef} className="bracket-scroll-wrap" data-scroll-start="true" data-scroll-end="false">
      <div ref={scrollRef} className="max-h-[75vh] overflow-auto -mx-2 px-2 pb-2 scroll-smooth">
        {children}
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
  const ordered = resolveBracketOrder(bracket);

  const hasMatches: Record<RoundKey, boolean> = {
    round32: ordered.round32.length > 0,
    round16: ordered.round16.length > 0,
    quarterfinals: ordered.quarterfinals.length > 0,
    semifinals: ordered.semifinals.length > 0,
    final: ordered.final.length > 0
  };

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

      <BracketScrollWrap>
        <section className="bracket-section flex min-w-max lg:min-w-0 items-stretch">
          {ROUND_ORDER.map((key, idx) => {
            const nextKey = ROUND_ORDER[idx + 1];
            return (
              <RoundColumn
                key={key}
                roundKey={key}
                matches={ordered[key]}
                sideById={sideById}
                onOpenMatch={onOpenMatch}
                kickoffLabeler={kickoffLabeler}
                hasNextRound={nextKey ? hasMatches[nextKey] : false}
              />
            );
          })}
        </section>
      </BracketScrollWrap>

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
