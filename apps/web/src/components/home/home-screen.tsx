"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type MatchSummary, type PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero, ProgressCompact, StatusTag, colors, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { MarathonPredictionModal } from "@/components/matches/marathon-prediction-modal";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches, getPreTournamentSummary } from "@/lib/api/client";
import { copyForLocale, formatDateTime, type AppLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";

function toStageLabel(match: MatchSummary, locale: AppLocale) {
  if (match.stage === "group" && match.groupId) {
    return copyForLocale(locale, `Grupo ${match.groupId}`, `Group ${match.groupId}`);
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

  return labels[locale][match.stage as keyof (typeof labels)["es"]] ?? match.stage;
}

function toKickoffLabel(iso: string, locale: AppLocale) {
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

function toCompletionCopy(summary: PreTournamentSummary, locale: AppLocale) {
  if (summary.totalMatches === 0) {
    return copyForLocale(locale, "Todavia no cargamos partidos de grupos para completar.", "We still haven't loaded group-stage matches to complete.");
  }

  if (summary.completedMatches === 0) {
    return copyForLocale(locale, `Empieza tu Mundial completando los ${summary.totalMatches} partidos de grupos.`, `Start your World Cup by completing the ${summary.totalMatches} group-stage matches.`);
  }

  if (summary.remainingMatches === 0) {
    return copyForLocale(locale, "Ya completaste toda la fase de grupos. Ahora puedes revisar como queda tu Mundial.", "You've completed the whole group stage. Now you can review how your World Cup looks.");
  }

  return copyForLocale(locale, `Ya llevas ${summary.completionPercentage}% y te faltan ${summary.remainingMatches} partidos para cerrar grupos.`, `You're already ${summary.completionPercentage}% in and still have ${summary.remainingMatches} matches left to close the groups.`);
}

function toLeagueSummaryCopy(summary: PreTournamentSummary, locale: AppLocale) {
  if (summary.remainingMatches === 0) {
    return copyForLocale(locale, "Ya cerraste grupos. Revisa como queda tu torneo y compártelo.", "You've already closed the groups. Review your tournament and share it.");
  }

  if (summary.completedMatches === 0) {
    return copyForLocale(locale, "Cada partido que cargues empieza a darle forma a tu tabla proyectada.", "Every match you complete starts shaping your projected table.");
  }

  return copyForLocale(locale, `Te quedan ${summary.remainingMatches} partidos para completar tu simulacion y compararla con tus ligas.`, `You still have ${summary.remainingMatches} matches left to complete your simulation and compare it with your leagues.`);
}

function toSupportCardTitle(summary: PreTournamentSummary | null, profileDisplayName: string | null, locale: AppLocale) {
  if (summary?.isPreTournament) {
    return profileDisplayName
      ? copyForLocale(locale, `${profileDisplayName}, tu liga te espera`, `${profileDisplayName}, your league is waiting`)
      : copyForLocale(locale, "Tu liga te espera", "Your league is waiting");
  }

  return profileDisplayName
    ? copyForLocale(locale, `${profileDisplayName}, sigue sumando`, `${profileDisplayName}, keep climbing`)
    : copyForLocale(locale, "Tu competencia sigue viva", "Your competition is still alive");
}

function toTournamentSupportCopy(summary: PreTournamentSummary | null, locale: AppLocale) {
  if (summary?.isPreTournament) {
    return copyForLocale(locale, "Tu Mundial se actualiza a medida que completas grupos.", "Your World Cup updates as you complete the groups.");
  }

  return copyForLocale(locale, "Tu Mundial sigue disponible para revisar tus grupos proyectados.", "Your World Cup stays available to review your projected groups.");
}

function pickPriorityMatch(matches: MatchSummary[]) {
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

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();

  if (kickoffDifference !== 0) {
    return kickoffDifference;
  }

  return left.matchId.localeCompare(right.matchId);
}

export type HomeScreenViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  preTournamentSummary: PreTournamentSummary | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLeagues: () => void;
  onOpenRankings: () => void;
  onOpenTournament: () => void;
};

export function HomeScreenView({
  profileDisplayName,
  items,
  preTournamentSummary,
  isLoading,
  errorMessage,
  onRetry,
  onOpenMatch,
  onOpenMatches,
  onOpenLeagues,
  onOpenRankings,
  onOpenTournament
}: HomeScreenViewProps) {
  const { locale } = useLocale();
  const pendingMatches = useMemo(() => items.filter((match) => canEditPrediction(match)), [items]);
  const savedEditableMatches = useMemo(
    () => items.filter((match) => canEditPrediction(match) && match.predictionStatus === "saved_editable"),
    [items]
  );
  const scoredMatches = useMemo(() => items.filter((match) => match.predictionStatus === "scored"), [items]);
  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);
  const nextOpeningMatch = useMemo(() => pickNextOpeningMatch(items), [items]);
  const nextPreTournamentMatch = useMemo(
    () => items.find((match) => match.matchId === preTournamentSummary?.nextPendingMatchId) ?? null,
    [items, preTournamentSummary?.nextPendingMatchId]
  );

  if (preTournamentSummary?.isPreTournament) {
    return (
      <div style={{ display: "grid", gap: spacing[16] }}>
        {nextPreTournamentMatch ? (
          <NextMatchHero
            awayTeam={{
              teamName: nextPreTournamentMatch.awayTeam.name,
              fifaCode: nextPreTournamentMatch.awayTeam.fifaCode,
              flagAsset: nextPreTournamentMatch.awayTeam.flagAsset,
              flagUrl: nextPreTournamentMatch.awayTeam.flagUrl
            }}
            ctaLabel={nextPreTournamentMatch.userPredictionSummary ? "Editar prediccion" : "Seguir completando"}
            eyebrow="SIGUE TU MUNDIAL"
            helperText={
              nextPreTournamentMatch.userPredictionSummary
                ? copyForLocale(locale, `Ya guardaste ${nextPreTournamentMatch.userPredictionSummary}.`, `You already saved ${nextPreTournamentMatch.userPredictionSummary}.`)
                : canEditPrediction(nextPreTournamentMatch)
                  ? copyForLocale(locale, "Tu siguiente partido ya esta listo para cargar.", "Your next match is ready to fill right now.")
                  : copyForLocale(locale, `La ventana abre ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}.`, `The window opens ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}.`)
            }
            homeTeam={{
              teamName: nextPreTournamentMatch.homeTeam.name,
              fifaCode: nextPreTournamentMatch.homeTeam.fifaCode,
              flagAsset: nextPreTournamentMatch.homeTeam.flagAsset,
              flagUrl: nextPreTournamentMatch.homeTeam.flagUrl
            }}
            metaLabel={`${toStageLabel(nextPreTournamentMatch, locale)} · ${toKickoffLabel(nextPreTournamentMatch.kickoffAt, locale)}`}
            onAction={() => onOpenMatch(nextPreTournamentMatch.matchId)}
            onSecondaryAction={onOpenMatches}
            secondaryCtaLabel={copyForLocale(locale, "Ver calendario", "See schedule")}
            status={canEditPrediction(nextPreTournamentMatch) ? "editable" : "locked"}
            statusLabel={canEditPrediction(nextPreTournamentMatch) ? copyForLocale(locale, "Listo para cargar", "Ready to fill") : toCountdownLabel(nextPreTournamentMatch.predictionOpensAt, locale)}
            title={`${nextPreTournamentMatch.homeTeam.name} vs ${nextPreTournamentMatch.awayTeam.name}`}
          />
        ) : (
          <Card
            elevated
            style={{
              gap: spacing[12],
              padding: spacing[20],
              background:
                "radial-gradient(circle at top right, rgba(255, 196, 76, 0.16), transparent 28%), radial-gradient(circle at left center, rgba(47, 107, 255, 0.18), transparent 32%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
            }}
          >
            <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
            <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>
              {copyForLocale(locale, "Completa tu Mundial", "Complete your World Cup")}
            </h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>{toCompletionCopy(preTournamentSummary, locale)}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={onOpenMatches}>{copyForLocale(locale, "Ver calendario", "See schedule")}</Button>
              <Button variant="ghost" onClick={onOpenTournament}>
                {copyForLocale(locale, "Ir a Tu Mundial", "Go to Your World Cup")}
              </Button>
            </div>
          </Card>
        )}

        <ProgressCompact
          items={[
            {
              label: "CARGADOS",
              value: String(preTournamentSummary.completedMatches),
              hint: `de ${preTournamentSummary.totalMatches}`
            },
            {
              label: "PENDIENTES",
              value: String(preTournamentSummary.remainingMatches),
              hint: copyForLocale(locale, "por completar", "left to fill")
            },
            {
              label: "AVANCE",
              value: `${preTournamentSummary.completionPercentage}%`,
              hint: copyForLocale(locale, "tu simulacion", "your run")
            }
          ]}
        />

        <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Card elevated style={{ gap: 10 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>TU LIGA HOY</span>
              <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
                {toSupportCardTitle(preTournamentSummary, profileDisplayName, locale)}
              </h2>
            </div>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{toLeagueSummaryCopy(preTournamentSummary, locale)}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={onOpenRankings}>
                {copyForLocale(locale, "Ver tabla", "See table")}
              </Button>
              <Button variant="ghost" onClick={onOpenLeagues}>
                {copyForLocale(locale, "Invitar amigos", "Invite friends")}
              </Button>
            </div>
          </Card>

          <Card elevated style={{ gap: 10 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
              <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
                {copyForLocale(locale, "Sigue tomando forma", "It keeps taking shape")}
              </h2>
            </div>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{toTournamentSupportCopy(preTournamentSummary, locale)}</p>
            <Button variant="ghost" onClick={onOpenTournament}>
              {copyForLocale(locale, "Abrir Tu Mundial", "Open Your World Cup")}
            </Button>
          </Card>
        </div>

        <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues de la accion principal.", "Reserved slot for native sponsorship, placed after the main action.")} />

        {errorMessage ? (
          <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
            <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar tu home</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
            <Button variant="secondary" onClick={onRetry}>
              Reintentar
            </Button>
          </Card>
        ) : null}

        {isLoading ? (
          <Card style={{ gap: spacing[10], padding: spacing[16] }}>
            <div style={{ width: 124, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
            <div style={{ width: "72%", height: 14, borderRadius: 999, background: "rgba(255, 255, 255, 0.05)" }} />
            <div style={{ width: "100%", height: 72, borderRadius: 16, background: "rgba(255, 255, 255, 0.03)" }} />
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      {priorityMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: priorityMatch.awayTeam.name,
            fifaCode: priorityMatch.awayTeam.fifaCode,
            flagAsset: priorityMatch.awayTeam.flagAsset,
            flagUrl: priorityMatch.awayTeam.flagUrl
          }}
          ctaLabel={priorityMatch.userPredictionSummary ? "Editar prediccion" : "Predecir ahora"}
          eyebrow="PARTIDO DESTACADO"
          helperText={
            priorityMatch.userPredictionSummary
              ? copyForLocale(locale, `Ya guardaste ${priorityMatch.userPredictionSummary}.`, `You already saved ${priorityMatch.userPredictionSummary}.`)
              : copyForLocale(locale, "Tu siguiente prediccion esta lista para resolver.", "Your next prediction is ready to be solved.")
          }
          homeTeam={{
            teamName: priorityMatch.homeTeam.name,
            fifaCode: priorityMatch.homeTeam.fifaCode,
            flagAsset: priorityMatch.homeTeam.flagAsset,
            flagUrl: priorityMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(priorityMatch, locale)} · ${toKickoffLabel(priorityMatch.kickoffAt, locale)}`}
          onAction={() => onOpenMatch(priorityMatch.matchId)}
          onSecondaryAction={onOpenMatches}
          secondaryCtaLabel={copyForLocale(locale, "Ver calendario", "See schedule")}
          status={canEditPrediction(priorityMatch) ? "editable" : "locked"}
          statusLabel={canEditPrediction(priorityMatch) ? copyForLocale(locale, "Pendiente", "Pending") : copyForLocale(locale, "Cerrado", "Locked")}
          title={`${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}`}
        />
      ) : null}

      {!priorityMatch && nextOpeningMatch ? (
        <Card elevated style={{ gap: spacing[16], padding: spacing[18] }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.small, color: colors.gold500 }}>PROXIMA VENTANA</span>
            <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>
              {copyForLocale(locale, "Tu siguiente prediccion abre pronto", "Your next prediction opens soon")}
            </h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
              {nextOpeningMatch.homeTeam.name} vs {nextOpeningMatch.awayTeam.name} · {toStageLabel(nextOpeningMatch, locale)}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
              {copyForLocale(locale, "Se habilita", "It opens")} {toKickoffLabel(nextOpeningMatch.predictionOpensAt, locale)}
            </span>
            <StatusTag status="locked" label={toCountdownLabel(nextOpeningMatch.predictionOpensAt, locale)} />
          </div>

          <Button variant="secondary" onClick={onOpenMatches}>
            {copyForLocale(locale, "Ver calendario", "See schedule")}
          </Button>
        </Card>
      ) : null}

      <ProgressCompact
        items={[
          {
            label: "PUNTUADOS",
            value: String(scoredMatches.length),
            hint: copyForLocale(locale, "ya resueltos", "already scored")
          },
          {
            label: "PENDIENTES",
            value: String(pendingMatches.length),
            hint: copyForLocale(locale, "todavia editables", "still editable")
          },
          {
            label: "GUARDADOS",
            value: String(savedEditableMatches.length),
            hint: copyForLocale(locale, "para revisar", "ready to review")
          }
        ]}
      />

      <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card elevated style={{ gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>TU LIGA HOY</span>
              <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
                {toSupportCardTitle(preTournamentSummary, profileDisplayName, locale)}
              </h2>
            </div>
          </div>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            {copyForLocale(locale, "Revisa como viene tu competencia y vuelve rapido a tu siguiente partido.", "Check how your competition stands and jump back into your next match.")}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={onOpenRankings}>
              {copyForLocale(locale, "Ver tabla", "See table")}
            </Button>
            <Button variant="ghost" onClick={onOpenLeagues}>
              {copyForLocale(locale, "Ver mis ligas", "See my leagues")}
            </Button>
          </div>
        </Card>

        <Card elevated style={{ gap: 10 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
              {copyForLocale(locale, "Sigue disponible", "Still available")}
            </h2>
          </div>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{toTournamentSupportCopy(preTournamentSummary, locale)}</p>
          <Button variant="ghost" onClick={onOpenTournament}>
            {copyForLocale(locale, "Abrir Tu Mundial", "Open Your World Cup")}
          </Button>
        </Card>
      </div>

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues del bloque principal.", "Reserved slot for native sponsorship, placed after the main block.")} />

      {errorMessage ? (
        <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar tu home</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card style={{ gap: spacing[10], padding: spacing[16] }}>
          <div style={{ width: 124, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
          <div style={{ width: "72%", height: 14, borderRadius: 999, background: "rgba(255, 255, 255, 0.05)" }} />
          <div style={{ width: "100%", height: 72, borderRadius: 16, background: "rgba(255, 255, 255, 0.03)" }} />
        </Card>
      ) : null}
    </div>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { profile, status, user } = useAuth();
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [preTournamentSummary, setPreTournamentSummary] = useState<PreTournamentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [marathonStartMatchId, setMarathonStartMatchId] = useState<string | null>(null);
  const [dismissedCycle, setDismissedCycle] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setPreTournamentSummary(null);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [matchesResponse, summaryResponse] = await Promise.all([
          getMatches(token, { limit: 64 }),
          getPreTournamentSummary(token)
        ]);

        if (!cancelled) {
          setItems(matchesResponse.items);
          setPreTournamentSummary(summaryResponse);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(error instanceof Error ? error.message : "No pudimos cargar tu actividad.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);
  const pendingGroupMatches = useMemo(
    () =>
      items
        .filter((match) => match.stage === "group" && match.status === "scheduled" && !match.isFinished && match.predictionStatus !== "scored")
        .sort(compareMatchesChronologically),
    [items]
  );
  const matchesById = useMemo(() => new Map(items.map((match) => [match.matchId, match])), [items]);

  useEffect(() => {
    if (isLoading || dismissedCycle || activeMatchId || !priorityMatch || preTournamentSummary?.isPreTournament) {
      return;
    }

    setActiveMatchId(priorityMatch.matchId);
  }, [activeMatchId, dismissedCycle, isLoading, preTournamentSummary?.isPreTournament, priorityMatch]);

  return (
    <>
      <HomeScreenView
        profileDisplayName={profile?.displayName ?? null}
        items={items}
        preTournamentSummary={preTournamentSummary}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((current) => current + 1)}
        onOpenMatch={(matchId) => {
          if (preTournamentSummary?.isPreTournament) {
            setMarathonStartMatchId(matchId);
            return;
          }

          setActiveMatchId(matchId);
        }}
        onOpenMatches={() => router.push(APP_ROUTES.matches)}
        onOpenLeagues={() => router.push(APP_ROUTES.leagues)}
        onOpenRankings={() => router.push(APP_ROUTES.rankings)}
        onOpenTournament={() => router.push(APP_ROUTES.tournament)}
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

      <MarathonPredictionModal
        isOpen={marathonStartMatchId !== null}
        initialMatchId={marathonStartMatchId}
        matchIds={pendingGroupMatches.map((match) => match.matchId)}
        matchesById={matchesById}
        preTournamentSummary={preTournamentSummary}
        onClose={() => setMarathonStartMatchId(null)}
        onSaved={() => setReloadKey((current) => current + 1)}
      />
    </>
  );
}
