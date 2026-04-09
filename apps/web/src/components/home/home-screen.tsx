"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchSummary } from "@prode/shared";
import { Button, Card, StatusTag, TeamDisplay, colors, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches } from "@/lib/api/client";

function toStageLabel(match: MatchSummary) {
  if (match.stage === "group" && match.groupId) {
    return `Grupo ${match.groupId}`;
  }

  const labels: Record<string, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[match.stage] ?? match.stage;
}

function toKickoffLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function pickPriorityMatch(matches: MatchSummary[]) {
  return matches.find((match) => match.isEditable && match.predictionStatus === "empty") ?? matches.find((match) => match.isEditable) ?? null;
}

export function HomeScreen() {
  const router = useRouter();
  const { profile, status, user } = useAuth();
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

      try {
        const token = await user.getIdToken();
        const response = await getMatches(token, { limit: 12 });

        if (!cancelled) {
          setItems(response.items);
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

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const pendingMatches = useMemo(() => items.filter((match) => match.isEditable), [items]);
  const savedEditableMatches = useMemo(
    () => items.filter((match) => match.isEditable && match.predictionStatus === "saved_editable"),
    [items]
  );
  const scoredMatches = useMemo(() => items.filter((match) => match.predictionStatus === "scored"), [items]);
  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);

  useEffect(() => {
    if (isLoading || dismissedCycle || activeMatchId || !priorityMatch) {
      return;
    }

    setActiveMatchId(priorityMatch.matchId);
  }, [activeMatchId, dismissedCycle, isLoading, priorityMatch]);

  return (
    <>
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
              {pendingMatches.length > 0 ? `Te faltan ${pendingMatches.length} partidos` : "Ya vas al dia"}
            </h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
              {priorityMatch
                ? `Tu proximo partido es ${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}.`
                : "No tienes pendientes inmediatos. Aprovecha para revisar resultados y tus ligas."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => (priorityMatch ? setActiveMatchId(priorityMatch.matchId) : router.push("/matches"))}>
              {priorityMatch ? "Predecir ahora" : "Ver partidos"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/leagues")}>
              Ver mis ligas
            </Button>
          </div>
        </Card>

        {priorityMatch ? (
          <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ ...typography.small, color: colors.primary500 }}>PROXIMO PARTIDO</span>
                <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                  {toStageLabel(priorityMatch)} · {toKickoffLabel(priorityMatch.kickoffAt)}
                </span>
              </div>
              <StatusTag status={priorityMatch.isEditable ? "editable" : "locked"} label={priorityMatch.isEditable ? "Pendiente" : "Cerrado"} />
            </div>

            <div style={{ display: "grid", gap: spacing[12] }}>
              <TeamDisplay teamName={priorityMatch.homeTeam.name} flagUrl={priorityMatch.homeTeam.flagUrl} size="lg" weight={700} />
              <div style={{ paddingLeft: 46, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
              <TeamDisplay teamName={priorityMatch.awayTeam.name} flagUrl={priorityMatch.awayTeam.flagUrl} size="lg" weight={700} />
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
                {priorityMatch.userPredictionSummary ? `Ya guardaste ${priorityMatch.userPredictionSummary}` : "Aun no predijiste este partido"}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                Deadline exacto: {toKickoffLabel(priorityMatch.deadlineAt)}
              </span>
            </div>

            <Button fullWidth onClick={() => setActiveMatchId(priorityMatch.matchId)}>
              {priorityMatch.userPredictionSummary ? "Editar prediccion" : "Predecir ahora"}
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
              <span style={{ ...typography.small, color: colors.textMuted }}>TU POSICION</span>
              <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{profile?.displayName ?? "Tu perfil"}</h2>
            </div>
            <Button variant="ghost" onClick={() => router.push("/rankings")}>
              Ver posiciones
            </Button>
          </div>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Tus ligas y posiciones van a aparecer aca con prioridad competitiva. Por ahora, este bloque ya queda listo para el nuevo loop visual.
          </p>
        </Card>

        {errorMessage ? (
          <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
            <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar tu home</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
            <Button variant="secondary" onClick={() => setReloadKey((current) => current + 1)}>
              Reintentar
            </Button>
          </Card>
        ) : null}
      </div>

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        onClose={() => {
          setActiveMatchId(null);
          setDismissedCycle(true);
        }}
        onSaved={() => {
          setActiveMatchId(null);
          setDismissedCycle(false);
          setReloadKey((current) => current + 1);
        }}
      />
    </>
  );
}
