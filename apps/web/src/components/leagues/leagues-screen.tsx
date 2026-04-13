"use client";

import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { LeagueDetail, LeagueSummary } from "@prode/shared";
import { Button, Card, StatusTag, colors, radii, spacing, typography } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, createLeague, getMyLeagues, joinLeague } from "@/lib/api/client";

type LeaguesScreenViewProps = {
  items: LeagueSummary[];
  mode: "create" | "join" | null;
  formState: {
    leagueName: string;
    inviteCode: string;
  };
  actionError: string | null;
  actionMessage: string | null;
  lastActionLeague: LeagueDetail | null;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onChangeMode: (mode: "create" | "join" | null) => void;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCreateLeague: (event: FormEvent<HTMLFormElement>) => void;
  onJoinLeague: (event: FormEvent<HTMLFormElement>) => void;
  onOpenRankings: () => void;
  onOpenLeagueDetail: (leagueId: string) => void;
  onRetry: () => void;
};

const inputStyle = {
  minHeight: 52,
  borderRadius: radii.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgMuted,
  color: colors.textPrimary,
  padding: "0 14px",
  fontSize: 16,
  outline: "none"
} satisfies React.CSSProperties;

export function LeaguesScreenView({
  items,
  mode,
  formState,
  actionError,
  actionMessage,
  lastActionLeague,
  isLoading,
  isSubmitting,
  errorMessage,
  onChangeMode,
  onFieldChange,
  onCreateLeague,
  onJoinLeague,
  onOpenRankings,
  onOpenLeagueDetail,
  onRetry
}: LeaguesScreenViewProps) {
  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>LIGAS</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tus ligas y tu lugar en cada una</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Crea una liga, sumate con un codigo y segui tu competencia sin salir de esta pantalla.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant={mode === "create" ? "secondary" : "primary"} onClick={() => onChangeMode(mode === "create" ? null : "create")}>
            {mode === "create" ? "Ocultar crear liga" : "Crear liga"}
          </Button>
          <Button variant={mode === "join" ? "secondary" : "ghost"} onClick={() => onChangeMode(mode === "join" ? null : "join")}>
            {mode === "join" ? "Ocultar join" : "Unirme con codigo"}
          </Button>
          <Button variant="ghost" onClick={onOpenRankings}>
            Ver posiciones
          </Button>
        </div>
      </Card>

      {mode === "create" ? (
        <Card elevated style={{ gap: spacing[16] }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.small, color: colors.primary500 }}>CREAR LIGA</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Abre tu mesa competitiva</h2>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              El nombre sale publicado para todos los miembros. Apenas la creas te devolvemos codigo e invite link.
            </p>
          </div>
          <form onSubmit={onCreateLeague} style={{ display: "grid", gap: spacing[12] }}>
            <label style={{ display: "grid", gap: spacing[8] }}>
              <span style={{ ...typography.small, color: colors.textSecondary }}>Nombre de la liga</span>
              <input
                name="leagueName"
                value={formState.leagueName}
                onChange={onFieldChange}
                minLength={3}
                maxLength={40}
                placeholder="Liga del Asado"
                required
                style={inputStyle}
              />
            </label>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear liga"}
            </Button>
          </form>
        </Card>
      ) : null}

      {mode === "join" ? (
        <Card elevated style={{ gap: spacing[16] }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.small, color: colors.gold500 }}>JOIN POR CODIGO</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Entra a una liga existente</h2>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              Pega el codigo que te compartieron. Lo normalizamos y validamos antes de sumarte.
            </p>
          </div>
          <form onSubmit={onJoinLeague} style={{ display: "grid", gap: spacing[12] }}>
            <label style={{ display: "grid", gap: spacing[8] }}>
              <span style={{ ...typography.small, color: colors.textSecondary }}>Codigo de invitacion</span>
              <input
                name="inviteCode"
                value={formState.inviteCode}
                onChange={onFieldChange}
                minLength={4}
                maxLength={24}
                placeholder="ASADO26"
                required
                style={{ ...inputStyle, textTransform: "uppercase" }}
              />
            </label>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uniendome..." : "Unirme a la liga"}
            </Button>
          </form>
        </Card>
      ) : null}

      {actionError ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <span style={{ ...typography.small, color: "#FCA5A5" }}>NO PUDIMOS COMPLETAR LA ACCION</span>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{actionError}</p>
        </Card>
      ) : null}

      {lastActionLeague ? (
        <Card
          elevated
          style={{
            gap: spacing[12],
            background:
              "radial-gradient(circle at top right, rgba(47, 107, 255, 0.16), transparent 28%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
          }}
        >
          <span style={{ ...typography.small, color: colors.primary500 }}>ACCION COMPLETADA</span>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{lastActionLeague.name}</h2>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            {actionMessage ?? "La liga ya quedo lista para competir."}
          </p>
          <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <Metric label="Codigo" value={lastActionLeague.inviteCode} />
            <Metric label="Jugadores" value={`${lastActionLeague.membersCount}/${lastActionLeague.memberLimit}`} />
            <Metric label="Tu rol" value={lastActionLeague.membershipRole === "owner" ? "Creador" : "Miembro"} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={() => onOpenLeagueDetail(lastActionLeague.leagueId)}>Ver detalle de liga</Button>
            <Button variant="ghost" onClick={onOpenRankings}>
              Ir a posiciones
            </Button>
          </div>
          {lastActionLeague.inviteLink ? (
            <div
              style={{
                display: "grid",
                gap: 6,
                padding: spacing[12],
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ ...typography.small, color: colors.textMuted }}>INVITE LINK</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary, wordBreak: "break-all" }}>{lastActionLeague.inviteLink}</span>
            </div>
          ) : null}
        </Card>
      ) : null}

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{errorMessage}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: spacing[8] }}>
          <div style={{ width: 96, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
          <div style={{ width: "100%", height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>SIN LIGAS TODAVIA</span>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Todavia no estas compitiendo en ninguna</h2>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Arriba ya puedes crear tu primera liga o entrar con un codigo. Cuando exista competencia materializada, tu posicion aparece aqui.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage
        ? items.map((league) => (
            <Card key={league.leagueId} elevated style={{ gap: spacing[12] }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ ...typography.small, color: colors.textMuted }}>LIGA ACTIVA</span>
                  <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{league.name}</h2>
                  <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>
                    {league.membersCount}/{league.memberLimit} jugadores
                  </p>
                </div>
                <StatusTag status={league.isActive ? "editable" : "locked"} label={league.isActive ? "Activa" : "Inactiva"} />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: spacing[8],
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"
                }}
              >
                <Metric label="Tu lugar" value={league.position ? `#${league.position}` : "Sin tabla"} />
                <Metric label="Tus puntos" value={`${league.userPoints}`} />
                <Metric label="Código" value={league.inviteCode} />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  padding: spacing[12],
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${colors.border}`
                }}
              >
                <span style={{ ...typography.small, color: colors.textMuted }}>ESTADO SOCIAL</span>
                <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textPrimary, fontWeight: 600 }}>
                  {league.position
                    ? `Estas compitiendo en el puesto #${league.position}.`
                    : "Tu posicion aparece cuando haya tabla materializada."}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>
                  {league.inviteLink
                    ? `Comparte este acceso cuando quieras sumar mas gente: ${league.inviteLink}`
                    : "Todavia no tenemos invite link disponible para esta liga."}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => onOpenLeagueDetail(league.leagueId)}>
                  Ver detalle
                </Button>
                <Button variant="ghost" onClick={onOpenRankings}>
                  Ver posiciones
                </Button>
              </div>
            </Card>
          ))
        : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 4,
        padding: spacing[12],
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${colors.border}`
      }}
    >
      <span style={{ ...typography.small, color: colors.textMuted }}>{label}</span>
      <span style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{value}</span>
    </div>
  );
}

export function LeaguesScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [items, setItems] = useState<LeagueSummary[]>([]);
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [formState, setFormState] = useState({
    leagueName: "",
    inviteCode: ""
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastActionLeague, setLastActionLeague] = useState<LeagueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const response = await getMyLeagues(token);

        if (!cancelled) {
          setItems(response.items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos cargar tus ligas.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleCreateLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setActionError("No encontramos una sesion activa.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await user.getIdToken();
      const league = await createLeague(token, {
        name: formState.leagueName
      });

      setLastActionLeague(league);
      setActionMessage("Liga creada. Ya tienes codigo e invite link para compartir.");
      setFormState((current) => ({ ...current, leagueName: "" }));
      setMode(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : "No pudimos crear la liga.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setActionError("No encontramos una sesion activa.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await user.getIdToken();
      const league = await joinLeague(token, {
        inviteCode: formState.inviteCode
      });

      setLastActionLeague(league);
      setActionMessage("Ya formas parte de la liga. Tu tabla se actualiza desde posiciones.");
      setFormState((current) => ({ ...current, inviteCode: "" }));
      setMode(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : "No pudimos unirte a la liga.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LeaguesScreenView
      items={items}
      mode={mode}
      formState={formState}
      actionError={actionError}
      actionMessage={actionMessage}
      lastActionLeague={lastActionLeague}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onChangeMode={(nextMode) => {
        setMode(nextMode);
        setActionError(null);
      }}
      onFieldChange={handleFieldChange}
      onCreateLeague={handleCreateLeague}
      onJoinLeague={handleJoinLeague}
      onOpenRankings={() => router.push("/rankings")}
      onOpenLeagueDetail={(leagueId) => router.push(`/leagues/${leagueId}`)}
      onRetry={() => setReloadKey((value) => value + 1)}
    />
  );
}
