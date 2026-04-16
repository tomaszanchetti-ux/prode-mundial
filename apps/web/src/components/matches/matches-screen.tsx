"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListMatchesQuery, MatchStage, MatchSummary } from "@prode/shared";
import { Button, Card, MatchCard, NextMatchHero } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches } from "@/lib/api/client";
import { copyForLocale, formatDateTime, type AppLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";

type FilterChip = {
  key: string;
  label: string;
  query: ListMatchesQuery;
};

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

const filterChips: FilterChip[] = [
  { key: "today", label: "Hoy", query: { filter: "today" } },
  { key: "pending", label: "Pendientes", query: { filter: "upcoming" } },
  { key: "upcoming", label: "Proximos", query: { filter: "upcoming" } },
  { key: "group", label: "Grupos", query: { stage: "group" } },
  { key: "R32", label: "Octavos", query: { stage: "R32" } },
  { key: "QF", label: "Cuartos", query: { stage: "QF" } },
  { key: "SF", label: "Semis", query: { stage: "SF" } },
  { key: "FINAL", label: "Final", query: { stage: "FINAL" } },
  { key: "all", label: "Todos", query: {} }
];

function toFilterLabel(key: string, locale: AppLocale) {
  const labels = {
    today: copyForLocale(locale, "Hoy", "Today"),
    pending: copyForLocale(locale, "Pendientes", "Pending"),
    upcoming: copyForLocale(locale, "Proximos", "Upcoming"),
    group: copyForLocale(locale, "Grupos", "Groups"),
    R32: copyForLocale(locale, "Octavos", "R32"),
    QF: copyForLocale(locale, "Cuartos", "Quarterfinals"),
    SF: copyForLocale(locale, "Semis", "Semis"),
    FINAL: copyForLocale(locale, "Final", "Final"),
    all: copyForLocale(locale, "Todos", "All")
  } as const;

  return labels[key as keyof typeof labels] ?? key;
}

function toLocalKickoffLabel(iso: string, locale: AppLocale) {
  return formatDateTime(locale, iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toCountdownLabel(targetIso: string, locale: AppLocale, now = new Date()) {
  const diffMs = new Date(targetIso).getTime() - now.getTime();

  if (diffMs <= 0) {
    return copyForLocale(locale, "Disponible ahora", "Available now");
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return copyForLocale(locale, `Abre en ${minutes}m`, `Opens in ${minutes}m`);
  }

  if (minutes === 0) {
    return copyForLocale(locale, `Abre en ${hours}h`, `Opens in ${hours}h`);
  }

  return copyForLocale(locale, `Abre en ${hours}h ${minutes}m`, `Opens in ${hours}h ${minutes}m`);
}

function toStageLabel(stage: MatchStage, groupId: string | null, locale: AppLocale) {
  if (stage === "group" && groupId) {
    return copyForLocale(locale, `Grupo ${groupId}`, `Group ${groupId}`);
  }

  const labels = {
    es: {
      R32: "Octavos",
      R16: "R16",
      QF: "Cuartos",
      SF: "Semifinal",
      BRONZE: "Tercer puesto",
      FINAL: "Final"
    },
    en: {
      R32: "Round of 32",
      R16: "Round of 16",
      QF: "Quarterfinal",
      SF: "Semifinal",
      BRONZE: "Third place",
      FINAL: "Final"
    }
  };

  return labels[locale][stage as keyof (typeof labels)["es"]] ?? stage;
}

function toCardTone(match: MatchSummary) {
  if (match.isScored || match.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (match.status === "live") {
    return "live" as const;
  }

  if (!canEditPrediction(match)) {
    return "locked" as const;
  }

  return "editable" as const;
}

function toStatusLabel(match: MatchSummary) {
  if (match.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (match.status === "live") {
    return "En vivo";
  }

  if (isPredictionWindowNotOpen(match)) {
    return "Abre despues";
  }

  if (!canEditPrediction(match)) {
    return "Cerrado";
  }

  if (match.predictionStatus === "saved_editable") {
    return "Guardado";
  }

  return "Pendiente";
}

function summarizeActiveFilter(query: ListMatchesQuery, locale: AppLocale) {
  if (query.filter === "today") {
    return copyForLocale(locale, "Tus partidos de hoy, listos para resolver rapido.", "Today's matches, ready to solve quickly.");
  }

  if (query.filter === "upcoming") {
    return copyForLocale(locale, "Los siguientes cruces abiertos para predecir o editar.", "The next open matches to predict or edit.");
  }

  if (query.stage === "group") {
    return copyForLocale(locale, "Todo lo que sigue vivo en fase de grupos.", "Everything still alive in the group stage.");
  }

  if (query.stage === "R32") {
    return copyForLocale(locale, "Cruces directos listos para escanear.", "Direct knockout matchups ready to scan.");
  }

  if (query.stage === "QF") {
    return copyForLocale(locale, "Cuartos con foco total en cada llave.", "Quarterfinals with total focus on every bracket.");
  }

  if (query.stage === "SF") {
    return copyForLocale(locale, "Semifinales para ajustar lo importante.", "Semifinals to fine-tune the important part.");
  }

  if (query.stage === "FINAL") {
    return copyForLocale(locale, "La definicion del torneo en una sola vista.", "The tournament decider in one single view.");
  }

  return copyForLocale(locale, "Todos tus partidos disponibles en una sola pasada.", "All your available matches in one pass.");
}

function toPredictionCopy(match: MatchSummary, locale: AppLocale) {
  if (match.predictionStatus === "scored") {
    return match.userPredictionSummary ? copyForLocale(locale, `Tu prediccion: ${match.userPredictionSummary}`, `Your prediction: ${match.userPredictionSummary}`) : copyForLocale(locale, "Partido puntuado", "Scored match");
  }

  if (!match.userPredictionSummary) {
    return copyForLocale(locale, "Aun no predijiste este partido", "You haven't predicted this match yet");
  }

  return copyForLocale(locale, `Tu prediccion: ${match.userPredictionSummary}`, `Your prediction: ${match.userPredictionSummary}`);
}

function toResultCopy(match: MatchSummary, locale: AppLocale) {
  if (match.predictionStatus === "scored") {
    return copyForLocale(locale, "Abre el detalle para ver resultado y puntos.", "Open the detail to see the result and points.");
  }

  if (isPredictionWindowNotOpen(match)) {
    return copyForLocale(locale, `Se habilita ${toLocalKickoffLabel(match.predictionOpensAt, locale)}.`, `Opens ${toLocalKickoffLabel(match.predictionOpensAt, locale)}.`);
  }

  if (!canEditPrediction(match)) {
    return copyForLocale(locale, "Prediccion cerrada. Solo queda seguir el partido.", "Prediction locked. You can only follow the match now.");
  }

  return copyForLocale(locale, `Deadline exacto: ${toLocalKickoffLabel(match.deadlineAt, locale)}`, `Exact deadline: ${toLocalKickoffLabel(match.deadlineAt, locale)}`);
}

function pickQuickMatch(matches: MatchSummary[]) {
  return matches.find((match) => canEditPrediction(match) && match.predictionStatus === "empty") ?? matches.find((match) => canEditPrediction(match)) ?? null;
}

function pickNextOpeningMatch(matches: MatchSummary[], now = new Date()) {
  return (
    matches.find(
      (match) =>
        !canEditPrediction(match) &&
        match.status === "scheduled" &&
        new Date(match.predictionOpensAt).getTime() > now.getTime()
    ) ?? null
  );
}

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

        <div className="flex gap-2 overflow-x-auto pb-[2px] sticky top-0 z-[2] filter-bar-bg">
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
