"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import type { MatchSummary } from "@prode/shared";
import { Card, ErrorCard, MatchCard, NextMatchHero, SkeletonMatchCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches } from "@/lib/api/client";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import { parsePredictionScore } from "@/lib/hero/to-hero-props";
import {
  applyClientFilter,
  filterChips,
  pickNextOpeningMatch,
  pickQuickMatch,
  toCardTone,
  toCountdownLabel,
  toFilterLabel,
  toLocalKickoffLabel,
  toPredictionCopy,
  toStageLabel,
  toStatusLabel
} from "./matches-helpers";

type MatchesScreenViewProps = {
  activeFilterKey: string;
  errorMessage: string | null;
  isLoading: boolean;
  items: MatchSummary[];
  onFilterSelect: (key: string) => void;
  onOpenQuickPredict: (matchId: string) => void;
  onRetry: () => void;
};

export function MatchesScreenView({
  activeFilterKey,
  errorMessage,
  isLoading,
  items,
  onFilterSelect,
  onOpenQuickPredict,
  onRetry
}: MatchesScreenViewProps) {
  const { locale } = useLocale();
  const activeFilter = filterChips.find((chip) => chip.key === activeFilterKey) ?? filterChips[0];
  const visibleItems = applyClientFilter(items, activeFilter.key);
  const quickMatch = pickQuickMatch(items);
  const nextOpeningMatch = pickNextOpeningMatch(items);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="grid gap-2">
          <h1 className="typo-h1 m-0 text-text-primary">{copyForLocale(locale, "Partidos", "Matches")}</h1>
        </div>

        {quickMatch ? (
          <NextMatchHero
            awayTeam={{
              teamName: quickMatch.awayTeam.name,
              fifaCode: quickMatch.awayTeam.fifaCode,
              flagAsset: quickMatch.awayTeam.flagAsset,
              flagUrl: quickMatch.awayTeam.flagUrl
            }}
            eyebrow={copyForLocale(locale, "MI PROXIMO", "MY NEXT")}
            score={parsePredictionScore(quickMatch.userPredictionSummary)}
            homeTeam={{
              teamName: quickMatch.homeTeam.name,
              fifaCode: quickMatch.homeTeam.fifaCode,
              flagAsset: quickMatch.homeTeam.flagAsset,
              flagUrl: quickMatch.homeTeam.flagUrl
            }}
            metaLabel={`${toStageLabel(quickMatch.stage, quickMatch.groupId, locale)} · ${toLocalKickoffLabel(quickMatch.kickoffAt, locale)}`}
            onAction={() => onOpenQuickPredict(quickMatch.matchId)}
            status={toCardTone(quickMatch)}
            statusLabel={toStatusLabel(quickMatch)}
            title={`${quickMatch.homeTeam.name} vs ${quickMatch.awayTeam.name}`}
          />
        ) : null}

        {!quickMatch && nextOpeningMatch ? (
          <Card elevated className="next-window-bg" style={{ gap: 10, padding: 14 }}>
            <span className="typo-small text-gold">{copyForLocale(locale, "PROXIMA VENTANA", "NEXT WINDOW")}</span>
            <strong className="text-[20px] leading-[1.1] text-text-primary">
              {nextOpeningMatch.homeTeam.name} vs {nextOpeningMatch.awayTeam.name}
            </strong>
            <span className="text-[14px] leading-[1.4] text-text-secondary">
              {copyForLocale(locale, "Se habilita", "Opens")} {toLocalKickoffLabel(nextOpeningMatch.predictionOpensAt, locale)} · {toCountdownLabel(nextOpeningMatch.predictionOpensAt, locale)}
            </span>
          </Card>
        ) : null}

        <div className="flex gap-1.5 overflow-x-auto sticky top-0 z-[2] filter-bar-bg px-[2px]">
          {filterChips.map((chip) => {
            const isActive = chip.key === activeFilter.key;
            const activeClass = chip.key === "saved" ? "filter-chip-active-saved" : "filter-chip-active";

            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onFilterSelect(chip.key)}
                className={`filter-chip ${isActive ? activeClass : "filter-chip-inactive"}`}
              >
                {toFilterLabel(chip.key, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <ErrorCard
          title={copyForLocale(locale, "No pudimos cargar los partidos", "We couldn't load the matches")}
          message={errorMessage}
          onRetry={onRetry}
        />
      ) : null}

      {isLoading ? (
        <section className="grid gap-[14px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMatchCard key={i} />
          ))}
        </section>
      ) : null}

      {!isLoading && !errorMessage && visibleItems.length === 0 ? (
        <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
          <span className="typo-eyebrow">{copyForLocale(locale, "SIN PARTIDOS", "NO MATCHES")}</span>
          <h2 className="typo-h2 m-0 text-text-primary">{copyForLocale(locale, "No encontramos cruces para este filtro", "We couldn't find matches for this filter")}</h2>
        </Card>
      ) : null}

      {!isLoading && visibleItems.length > 0 ? (
        <section className="grid gap-[14px]">
          {visibleItems.map((match) => (
            <MatchCard
              key={match.matchId}
              awayTeam={{
                teamName: match.awayTeam.name,
                fifaCode: match.awayTeam.fifaCode,
                flagAsset: match.awayTeam.flagAsset,
                flagUrl: match.awayTeam.flagUrl
              }}
              ctaLabel={
                match.ctaLabel === "Editar"
                  ? copyForLocale(locale, "Editar", "Edit")
                  : match.ctaLabel === "Predecir"
                    ? copyForLocale(locale, "Predecir", "Predict")
                    : match.ctaLabel
              }
              homeTeam={{
                teamName: match.homeTeam.name,
                fifaCode: match.homeTeam.fifaCode,
                flagAsset: match.homeTeam.flagAsset,
                flagUrl: match.homeTeam.flagUrl
              }}
              kickoffLabel={toLocalKickoffLabel(match.kickoffAt, locale)}
              onAction={() => onOpenQuickPredict(match.matchId)}
              predictionSummary={toPredictionCopy(match, locale)}
              stage={match.stage}
              groupId={match.groupId}
              stageLabel={toStageLabel(match.stage, match.groupId, locale)}
              status={toCardTone(match)}
              statusLabel={toStatusLabel(match)}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export function MatchesScreen() {
  const { status, user } = useAuth();
  const [activeFilterKey, setActiveFilterKey] = useState<string>("pending");
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [dismissedCycle, setDismissedCycle] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setItems([]);

      try {
        const token = await user.getIdToken();
        const response = await getMatches(token, { limit: 200 });

        if (!cancelled) {
          setItems(response.items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("No pudimos cargar los partidos.");
        }

        setItems([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const quickMatch = useMemo(() => pickQuickMatch(items), [items]);

  useEffect(() => {
    if (isLoading || dismissedCycle || activeMatchId || !quickMatch) {
      return;
    }

    setActiveMatchId(quickMatch.matchId);
  }, [activeMatchId, dismissedCycle, isLoading, quickMatch]);

  return (
    <>
      <MatchesScreenView
        activeFilterKey={activeFilterKey}
        errorMessage={errorMessage}
        isLoading={isLoading}
        items={items}
        onFilterSelect={(nextKey) => {
          setDismissedCycle(false);
          setActiveFilterKey(nextKey);
        }}
        onOpenQuickPredict={(matchId) => {
          setDismissedCycle(false);
          setActiveMatchId(matchId);
        }}
        onRetry={() => setReloadKey((current) => current + 1)}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        hasNextPending={
          items.filter(
            (m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId
          ).length > 0
        }
        onClose={() => {
          setActiveMatchId(null);
          setDismissedCycle(true);
        }}
        onSaved={() => {
          const pendingMatches = items
            .filter((m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId)
            .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
          const nextMatch = pendingMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            setActiveMatchId(null);
            setDismissedCycle(true);
          }
          setReloadKey((current) => current + 1);
        }}
        onSkip={() => {
          const pendingMatches = items
            .filter((m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId)
            .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
          const nextMatch = pendingMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            setActiveMatchId(null);
            setDismissedCycle(true);
          }
        }}
      />
    </>
  );
}
