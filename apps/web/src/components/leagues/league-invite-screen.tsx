"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, colors, radii, spacing, typography } from "@prode/ui";
import { APP_ROUTES } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getLeagueInvitePreview, joinLeague } from "@/lib/api/client";

type InvitePreviewState = Awaited<ReturnType<typeof getLeagueInvitePreview>>;

export function LeagueInviteScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuth();
  const token = searchParams.get("token");
  const [preview, setPreview] = useState<InvitePreviewState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loginHref = useMemo(() => {
    if (!token) {
      return APP_ROUTES.login;
    }

    return `${APP_ROUTES.login}?next=${encodeURIComponent(`/leagues/join?token=${token}`)}`;
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setErrorMessage("Falta el token de invitacion.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getLeagueInvitePreview(token);

        if (!cancelled) {
          setPreview(response);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos resolver esta invitacion.");
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
  }, [reloadKey, token]);

  async function handleJoin() {
    if (!token || !user) {
      return;
    }

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();
      const league = await joinLeague(idToken, { inviteToken: token });
      router.replace(`/leagues/${league.leagueId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "ALREADY_LEAGUE_MEMBER" && preview) {
        router.replace(`/leagues/${preview.leagueId}`);
        return;
      }

      setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos unirte a la liga.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 56px", display: "grid", gap: spacing[16] }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing[12] }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 20, lineHeight: 1, color: colors.textPrimary, letterSpacing: "-0.02em" }}>Prode Mundial</strong>
          <span style={{ ...typography.small, color: colors.textMuted }}>Invitacion a liga privada</span>
        </div>
        <Link href="/" style={{ color: colors.textSecondary, textDecoration: "none", fontWeight: 600 }}>
          Volver
        </Link>
      </header>

      <Card
        elevated
        style={{
          gap: spacing[16],
          padding: spacing[24],
          background:
            "radial-gradient(circle at top right, rgba(47, 107, 255, 0.18), transparent 30%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(7, 17, 31, 0.98) 100%)"
        }}
      >
        <span style={{ ...typography.small, color: colors.primary500 }}>INVITE LINK</span>
        <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>{preview?.name ?? "Liga privada"}</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
          Entra a esta liga y compite dentro de una tabla cerrada. Si ya tienes sesión, puedes confirmar el join desde aquí mismo.
        </p>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{errorMessage}</p>
          <Button variant="ghost" onClick={() => setReloadKey((value) => value + 1)}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: spacing[8] }}>
          <div style={{ width: 96, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
          <div style={{ width: "100%", height: 96, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
        </Card>
      ) : null}

      {preview ? (
        <Card elevated style={{ gap: spacing[16], padding: spacing[24] }}>
          <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <div style={{ padding: spacing[12], borderRadius: radii.md, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>Jugadores</span>
              <p style={{ margin: "8px 0 0", color: colors.textPrimary, fontWeight: 700 }}>{preview.membersCount}</p>
            </div>
            <div style={{ padding: spacing[12], borderRadius: radii.md, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>Limite</span>
              <p style={{ margin: "8px 0 0", color: colors.textPrimary, fontWeight: 700 }}>{preview.memberLimit}</p>
            </div>
            <div style={{ padding: spacing[12], borderRadius: radii.md, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>Estado</span>
              <p style={{ margin: "8px 0 0", color: colors.textPrimary, fontWeight: 700 }}>{preview.isActive ? "Activa" : "Inactiva"}</p>
            </div>
          </div>

          {status === "authenticated" ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button onClick={() => void handleJoin()} disabled={isJoining}>
                {isJoining ? "Uniendome..." : "Unirme a esta liga"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/leagues")}>
                Ir a mis ligas
              </Button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: spacing[10] }}>
              <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
                Para confirmar el join necesitas iniciar sesion primero. Te llevamos de vuelta a esta invitacion apenas entres.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button onClick={() => router.push(loginHref)}>Entrar para unirme</Button>
                <Button variant="ghost" onClick={() => router.push("/")}>
                  Volver al inicio
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </main>
  );
}
