"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type MatchSummary, type PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero, ProgressCompact, StatusTag, TeamIdentityRow, colors, spacing, typography } from "@prode/ui";
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
        <Card
          elevated
          style={{
            gap: spacing[12],
            padding: spacing[20],
            background:
              "radial-gradient(circle at top right, rgba(255, 196, 76, 0.16), transparent 28%), radial-gradient(circle at left center, rgba(47, 107, 255, 0.18), transparent 32%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
          }}
        >
          <span style={{ ...typography.small, color: colors.textMuted }}>SEGUIS DESDE ACA</span>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>
              {nextPreTournamentMatch ? copyForLocale(locale, "Tu proximo pendiente", "Your next pending match") : copyForLocale(locale, "Completa tu Mundial", "Complete your World Cup")}
            </h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
              {nextPreTournamentMatch
                ? copyForLocale(locale, `Sigue con ${nextPreTournamentMatch.homeTeam.name} vs ${nextPreTournamentMatch.awayTeam.name} y mantén el ritmo de tu simulacion.`, `Keep going with ${nextPreTournamentMatch.homeTeam.name} vs ${nextPreTournamentMatch.awayTeam.name} and keep the pace of your simulation.`)
                : toCompletionCopy(preTournamentSummary, locale)}
            </p>
          </div>

          {nextPreTournamentMatch ? (
            <NextMatchHero
              awayTeam={{
                teamName: nextPreTournamentMatch.awayTeam.name,
                fifaCode: nextPreTournamentMatch.awayTeam.fifaCode,
                flagAsset: nextPreTournamentMatch.awayTeam.flagAsset,
                flagUrl: nextPreTournamentMatch.awayTeam.flagUrl
              }}
              ctaLabel={nextPreTournamentMatch.userPredictionSummary ? "Editar prediccion" : "Seguir completando"}
              eyebrow="TU PROXIMO PENDIENTE"
              helperText={
                nextPreTournamentMatch.userPredictionSummary
                  ? copyForLocale(locale, `Ya guardaste ${nextPreTournamentMatch.userPredictionSummary}. Puedes volver a tocarla antes del kickoff.`, `You already saved ${nextPreTournamentMatch.userPredictionSummary}. You can still adjust it before kickoff.`)
                  : canEditPrediction(nextPreTournamentMatch)
                    ? copyForLocale(locale, "Puedes cargar este partido ahora mismo.", "You can fill this match right now.")
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
          ) : null}

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
                hint: "todavia por cargar"
              },
              {
                label: "AVANCE",
                value: `${preTournamentSummary.completionPercentage}%`,
                hint: "tu progreso global"
              }
            ]}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => (nextPreTournamentMatch ? onOpenMatch(nextPreTournamentMatch.matchId) : onOpenMatches())}>
              {copyForLocale(locale, "Seguir completando", "Keep going")}
            </Button>
            <Button variant="ghost" onClick={onOpenTournament}>
              {copyForLocale(locale, "Ir a Tu Mundial", "Go to Your World Cup")}
            </Button>
          </div>
        </Card>

        {nextPreTournamentMatch ? (
          <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
            <div
              style={{
                display: "grid",
                gap: 6,
                padding: 14,
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
                {nextPreTournamentMatch.userPredictionSummary
                  ? copyForLocale(locale, `Ya guardaste ${nextPreTournamentMatch.userPredictionSummary}`, `You already saved ${nextPreTournamentMatch.userPredictionSummary}`)
                  : canEditPrediction(nextPreTournamentMatch)
                    ? copyForLocale(locale, "Puedes cargar este partido ahora mismo", "You can fill this match right now")
                    : copyForLocale(locale, "Este es tu siguiente partido cronologico para completar", "This is your next chronological match to complete")}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                {canEditPrediction(nextPreTournamentMatch)
                  ? copyForLocale(locale, `Deadline exacto: ${toKickoffLabel(nextPreTournamentMatch.deadlineAt, locale)}`, `Exact deadline: ${toKickoffLabel(nextPreTournamentMatch.deadlineAt, locale)}`)
                  : copyForLocale(locale, `La ventana abre ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}`, `The window opens ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}`)}
              </span>
            </div>

            <Button fullWidth onClick={() => onOpenMatch(nextPreTournamentMatch.matchId)}>
              {nextPreTournamentMatch.userPredictionSummary ? copyForLocale(locale, "Editar prediccion", "Edit prediction") : copyForLocale(locale, "Seguir completando", "Keep going")}
            </Button>
          </Card>
        ) : null}

        <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>GRUPOS COMPLETADOS</span>
            <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{preTournamentSummary.completedMatches}</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>partidos ya cargados</span>
          </Card>
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>POR COMPLETAR</span>
            <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{preTournamentSummary.remainingMatches}</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>partidos todavia pendientes</span>
          </Card>
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
            <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{preTournamentSummary.completionPercentage}%</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>avance de tu simulacion</span>
          </Card>
        </div>

        <Card elevated style={{ gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>TU LIGA HOY</span>
              <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{profileDisplayName ? copyForLocale(locale, `${profileDisplayName}, sigue sumando`, `${profileDisplayName}, keep collecting points`) : copyForLocale(locale, "Tu competencia sigue viva", "Your competition is still on")}</h2>
            </div>
            <Button variant="ghost" onClick={onOpenRankings}>
              {copyForLocale(locale, "Ver tabla", "See table")}
            </Button>
          </div>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            {toLeagueSummaryCopy(preTournamentSummary, locale)}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="ghost" onClick={onOpenLeagues}>
              {copyForLocale(locale, "Invitar amigos", "Invite friends")}
            </Button>
            <Button variant="ghost" onClick={onOpenTournament}>
              {copyForLocale(locale, "Abrir Tu Mundial", "Open Your World Cup")}
            </Button>
          </div>
        </Card>

        <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo. Va debajo del bloque social para no interrumpir la accion principal.", "Reserved slot for native sponsorship. It sits below the social block so it doesn't interrupt the main action.")} />

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
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <strong style={{ fontSize: 16, color: colors.textPrimary }}>Cargando tu fase pre-torneo</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
              Estamos preparando tu progreso global y el siguiente partido para completar.
            </p>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card
        elevated
        style={{
          gap: spacing[12],
          padding: spacing[20],
          background:
            "radial-gradient(circle at top right, rgba(47, 107, 255, 0.18), transparent 30%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
        }}
      >
        <span style={{ ...typography.small, color: colors.textMuted }}>HOY EN PRODE MUNDIAL</span>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>
            {pendingMatches.length > 0 ? copyForLocale(locale, `Te faltan ${pendingMatches.length} partidos`, `You still have ${pendingMatches.length} matches left`) : nextOpeningMatch ? copyForLocale(locale, "Tu proxima ventana abre pronto", "Your next window opens soon") : copyForLocale(locale, "Ya vas al dia", "You're up to date")}
          </h1>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
            {priorityMatch
              ? copyForLocale(locale, `Tu proximo partido es ${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}.`, `Your next match is ${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}.`)
              : nextOpeningMatch
                ? copyForLocale(locale, `La siguiente prediccion se habilita para ${nextOpeningMatch.homeTeam.name} vs ${nextOpeningMatch.awayTeam.name}.`, `The next prediction window opens for ${nextOpeningMatch.homeTeam.name} vs ${nextOpeningMatch.awayTeam.name}.`)
                : copyForLocale(locale, "No tienes pendientes inmediatos. Aprovecha para revisar resultados y tus ligas.", "You have no immediate pending matches. Use the time to review results and your leagues.")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={() => (priorityMatch ? onOpenMatch(priorityMatch.matchId) : onOpenMatches())}>
            {priorityMatch ? copyForLocale(locale, "Predecir ahora", "Predict now") : copyForLocale(locale, "Ver partidos", "See matches")}
          </Button>
          <Button variant="ghost" onClick={onOpenLeagues}>
            {copyForLocale(locale, "Ver mis ligas", "See my leagues")}
          </Button>
        </div>
      </Card>

      {priorityMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: priorityMatch.awayTeam.name,
            fifaCode: priorityMatch.awayTeam.fifaCode,
            flagAsset: priorityMatch.awayTeam.flagAsset,
            flagUrl: priorityMatch.awayTeam.flagUrl
          }}
          ctaLabel={priorityMatch.userPredictionSummary ? "Editar prediccion" : "Predecir ahora"}
          eyebrow="TU PROXIMO PENDIENTE"
          helperText={
            priorityMatch.userPredictionSummary
              ? copyForLocale(locale, `Ya guardaste ${priorityMatch.userPredictionSummary}. Deadline exacto: ${toKickoffLabel(priorityMatch.deadlineAt, locale)}`, `You already saved ${priorityMatch.userPredictionSummary}. Exact deadline: ${toKickoffLabel(priorityMatch.deadlineAt, locale)}`)
              : copyForLocale(locale, `Aun no predijiste este partido. Deadline exacto: ${toKickoffLabel(priorityMatch.deadlineAt, locale)}`, `You haven't predicted this match yet. Exact deadline: ${toKickoffLabel(priorityMatch.deadlineAt, locale)}`)
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
          secondaryCtaLabel={copyForLocale(locale, "Mas tarde", "Later")}
          status={canEditPrediction(priorityMatch) ? "editable" : "locked"}
          statusLabel={canEditPrediction(priorityMatch) ? copyForLocale(locale, "Pendiente", "Pending") : copyForLocale(locale, "Cerrado", "Locked")}
          title={`${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}`}
        />
      ) : null}

      {!priorityMatch && nextOpeningMatch ? (
        <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ ...typography.small, color: colors.gold500 }}>PROXIMA PREDICCION</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                {toStageLabel(nextOpeningMatch, locale)} · {toKickoffLabel(nextOpeningMatch.kickoffAt, locale)}
              </span>
            </div>
            <StatusTag status="locked" label={toCountdownLabel(nextOpeningMatch.predictionOpensAt, locale)} />
          </div>

          <div style={{ display: "grid", gap: spacing[12] }}>
            <TeamIdentityRow
              teamName={nextOpeningMatch.homeTeam.name}
              fifaCode={nextOpeningMatch.homeTeam.fifaCode}
              flagAsset={nextOpeningMatch.homeTeam.flagAsset}
              flagUrl={nextOpeningMatch.homeTeam.flagUrl}
              size="lg"
              weight={700}
            />
            <div style={{ paddingLeft: 46, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
            <TeamIdentityRow
              teamName={nextOpeningMatch.awayTeam.name}
              fifaCode={nextOpeningMatch.awayTeam.fifaCode}
              flagAsset={nextOpeningMatch.awayTeam.flagAsset}
              flagUrl={nextOpeningMatch.awayTeam.flagUrl}
              size="lg"
              weight={700}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 6,
              padding: 14,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
              {copyForLocale(locale, "La ventana abre", "The window opens")} {toKickoffLabel(nextOpeningMatch.predictionOpensAt, locale)}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
              Luego podras crear o editar tu marcador libremente hasta el kickoff.
            </span>
          </div>

          <Button variant="secondary" fullWidth onClick={onOpenMatches}>
            Ver calendario
          </Button>
        </Card>
      ) : null}

      <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>RESUMEN DEL DIA</span>
          <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{scoredMatches.length}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>partidos ya puntuados</span>
        </Card>
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>PENDIENTES</span>
          <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{pendingMatches.length}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>todavia editables</span>
        </Card>
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>YA GUARDADOS</span>
          <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{savedEditableMatches.length}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>listos para revisar</span>
        </Card>
      </div>

      <Card elevated style={{ gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU LIGA HOY</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{profileDisplayName ?? "Tu posicion actual"}</h2>
          </div>
          <Button variant="ghost" onClick={onOpenRankings}>
            Ver tabla
          </Button>
        </div>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Tu contexto competitivo aparece aca para recordarte por que importa seguir prediciendo.
        </p>
      </Card>

      <Card elevated style={{ gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
              Sigue disponible mientras el torneo ya esta en marcha
            </h2>
          </div>
          <Button variant="ghost" onClick={onOpenTournament}>
            Abrir
          </Button>
        </div>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Revisa como quedaron tus grupos proyectados aunque la prioridad principal ya vuelva a ser tu proximo partido editable.
        </p>
      </Card>

      {errorMessage ? (
        <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar tu home</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
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
