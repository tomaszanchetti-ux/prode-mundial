"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchSummary } from "@prode/shared";
import { Button, Card, MatchCard, NextMatchHero } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches } from "@/lib/api/client";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import {
  filterChips,
  pickNextOpeningMatch,
  pickQuickMatch,
  summarizeActiveFilter,
  toCardTone,
  toCountdownLabel,
  toFilterLabel,
  toLocalKickoffLabel,
  toPredictionCopy,
  toResultCopy,
  toStageLabel,
  toStatusLabel
} from "./matches-helpers";

type MatchesScreenViewProps = {
  activeFilterKey: string;
  errorMessage: string | null;
  isLoading: boolean;
  items: MatchSummary[];
  onFilterSelect: (key: string) => void;
  onOpenMatch: (matchId: string) => void;
  onOpenQuickPredict: (matchId: string) => void;
  onRetry: () => void;
};

export function MatchesScreenView({
  activeFilterKey,
  errorMessage,
  isLoading,
  items,
  onFilterSelect,
  onOpenMatch,
  onOpenQuickPredict,
  onRetry
}: MatchesScreenViewProps) {
  const { locale } = useLocale();
  const activeFilter = filterChips.find((chip) => chip.key === activeFilterKey) ?? filterChips[0];
  const quickMatch = pickQuickMatch(items);
  const nextOpeningMatch = pickNextOpeningMatch(items);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="grid gap-2">
          <h1 className="typo-h1 m-0 text-text-primary">{copyForLocale(locale, "Partidos", "Matches")}</h1>
          <p className="typo-body m-0 text-text-secondary max-w-[560px]">
            {summarizeActiveFilter(activeFilter.query, locale)}
          </p>
        </div>

        {quickMatch ? (
          <NextMatchHero
            awayTeam={{
              teamName: quickMatch.awayTeam.name,
              fifaCode: quickMatch.awayTeam.fifaCode,
              flagAsset: quickMatch.awayTeam.flagAsset,
              flagUrl: quickMatch.awayTeam.flagUrl
            }}
            ctaLabel={quickMatch.userPredictionSummary ? copyForLocale(locale, "Editar prediccion", "Edit prediction") : copyForLocale(locale, "Predecir ahora", "Predict now")}
            eyebrow={copyForLocale(locale, "TU PROXIMO PENDIENTE", "YOUR NEXT PENDING MATCH")}
            helperText={
              quickMatch.userPredictionSummary
                ? copyForLocale(locale, `Ya dejaste ${quickMatch.userPredictionSummary}. Puedes retocarla antes del kickoff.`, `You already left ${quickMatch.userPredictionSummary}. You can still tweak it before kickoff.`)
                : copyForLocale(locale, "Entra directo y carga el marcador sin pasar por la lista.", "Jump in and set the score without going through the list.")
            }
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
            <Button variant="secondary" onClick={() => onOpenMatch(nextOpeningMatch.matchId)}>
              {copyForLocale(locale, "Ver detalle", "View detail")}
            </Button>
          </Card>
        ) : null}

        <div className="flex gap-1.5 overflow-x-auto sticky top-0 z-[2] filter-bar-bg px-[2px]">
          {filterChips.map((chip) => {
            const isActive = chip.key === activeFilter.key;

            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onFilterSelect(chip.key)}
                className={`filter-chip ${isActive ? "filter-chip-active" : "filter-chip-inactive"}`}
              >
                {toFilterLabel(chip.key, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <Card className="alert-error" style={{ gap: 8 }}>
          <strong className="text-[16px]">{copyForLocale(locale, "No pudimos cargar los partidos", "We couldn't load the matches")}</strong>
          <p className="typo-body m-0">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            {copyForLocale(locale, "Reintentar", "Retry")}
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <section className="grid gap-[14px]">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} elevated style={{ minHeight: 176, opacity: 0.72 }}>
              <div className="grid gap-3">
                <div className="w-[88px] h-[10px] rounded-full bg-bg-interactive" />
                <div className="w-[54%] h-[12px] rounded-full bg-bg-interactive" />
                <div className="w-full h-[84px] rounded-md bg-bg-muted" />
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
          <span className="typo-small text-text-muted">{copyForLocale(locale, "SIN PARTIDOS", "NO MATCHES")}</span>
          <h2 className="typo-h2 m-0 text-text-primary">{copyForLocale(locale, "No encontramos cruces para este filtro", "We couldn't find matches for this filter")}</h2>
          <p className="typo-body m-0 text-text-secondary max-w-[420px]">
            {copyForLocale(locale, "Cambia de vista para seguir avanzando o revisar otra fase del torneo.", "Switch views to keep going or review another phase of the tournament.")}
          </p>
        </Card>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <section className="grid gap-[14px]">
          {items.map((match) => (
            <MatchCard
              key={match.matchId}
              awayTeam={{
                teamName: match.awayTeam.name,
                fifaCode: match.awayTeam.fifaCode,
                flagAsset: match.awayTeam.flagAsset,
                flagUrl: match.awayTeam.flagUrl
              }}
              ctaLabel={
                match.ctaLabel === "Editar prediccion"
                  ? copyForLocale(locale, "Editar prediccion", "Edit prediction")
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
              onAction={() => onOpenMatch(match.matchId)}
              predictionSummary={toPredictionCopy(match, locale)}
              resultSummary={toResultCopy(match, locale)}
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
  const router = useRouter();
  const { status, user } = useAuth();
  const [activeFilterKey, setActiveFilterKey] = useState<string>("pending");
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [dismissedCycle, setDismissedCycle] = useState(false);

  const activeFilter = useMemo(() => filterChips.find((chip) => chip.key === activeFilterKey) ?? filterChips[0], [activeFilterKey]);

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
        const response = await getMatches(token, activeFilter.query);

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
  }, [activeFilter, reloadKey, status, user]);

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
        onOpenMatch={(matchId) => router.push(`/matches/${matchId}`)}
        onOpenQuickPredict={(matchId) => {
          setDismissedCycle(false);
          setActiveMatchId(matchId);
        }}
        onRetry={() => setReloadKey((current) => current + 1)}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        onClose={() => {
          setActiveMatchId(null);
          setDismissedCycle(true);
        }}
        onSaved={() => {
          setActiveMatchId(null);
          setDismissedCycle(true);
          setReloadKey((current) => current + 1);
        }}
      />
    </>
  );
}
