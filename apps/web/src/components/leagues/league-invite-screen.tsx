"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, SkeletonCard } from "@prode/ui";
import { APP_ROUTES } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getLeagueInvitePreview, joinLeague } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";

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
  const [errorShowPlansCta, setErrorShowPlansCta] = useState(false);
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
      setErrorShowPlansCta(false);

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
    setErrorShowPlansCta(false);

    try {
      const idToken = await user.getIdToken();
      const league = await joinLeague(idToken, { inviteToken: token });
      track("league_joined", { leagueId: league.leagueId, joinMethod: "token" });
      router.replace(`/leagues/${league.leagueId}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "ALREADY_LEAGUE_MEMBER" && preview) {
        router.replace(`/leagues/${preview.leagueId}`);
        return;
      }

      if (error instanceof ApiClientError && error.code === "USER_LEAGUE_LIMIT_REACHED") {
        setErrorMessage(
          "Solo podés estar en 3 ligas a la vez. Salí de una actual para sumarte a otra o mejorá tu plan para participar en ligas ilimitadas."
        );
        setErrorShowPlansCta(true);
      } else if (error instanceof ApiClientError && error.code === "LEAGUE_CAPACITY_REACHED") {
        setErrorMessage(
          "Esta liga ya alcanzó el máximo de 20 jugadores. Conocé los planes Gold y Enterprise para ligas con más cupo."
        );
        setErrorShowPlansCta(true);
      } else {
        setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos unirte a la liga.");
      }
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main className="max-w-[980px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <header className="flex justify-between items-center gap-3">
        <div className="grid gap-1">
          <strong className="text-[20px] leading-none text-text-primary tracking-[-0.02em]">Prode Mundial</strong>
          <span className="typo-small text-text-muted">Invitacion a liga privada</span>
        </div>
        <Link href="/" className="text-text-secondary no-underline font-semibold">
          Volver
        </Link>
      </header>

      <Card elevated className="login-hero-bg gap-4 p-6">
        <span className="typo-small text-primary-500">Invitación</span>
        <h1 className="typo-h1 m-0 text-text-primary">{preview?.name ?? "Liga privada"}</h1>
      </Card>

      {errorMessage ? (
        <Card elevated className="gap-3">
          <p className="typo-body m-0 text-text-primary">{errorMessage}</p>
          {errorShowPlansCta ? (
            <Link
              href="/profile#planes"
              className="typo-body font-bold text-primary-600 no-underline"
            >
              Ver planes →
            </Link>
          ) : null}
          <Button variant="ghost" onClick={() => setReloadKey((value) => value + 1)}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? <SkeletonCard lines={2} /> : null}

      {preview ? (
        <Card elevated className="gap-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1">
              <span className="typo-meta">Jugadores</span>
              <p className="m-0 text-[18px] leading-none text-text-primary font-bold tabular-nums">{preview.membersCount}</p>
            </div>
            <div className="grid gap-1">
              <span className="typo-meta">Límite</span>
              <p className="m-0 text-[18px] leading-none text-text-primary font-bold tabular-nums">{preview.memberLimit}</p>
            </div>
            <div className="grid gap-1">
              <span className="typo-meta">Estado</span>
              <p className="m-0 text-[18px] leading-none text-text-primary font-bold">{preview.isActive ? "Activa" : "Inactiva"}</p>
            </div>
          </div>

          {status === "authenticated" ? (
            <div>
              <Button onClick={() => void handleJoin()} disabled={isJoining}>
                {isJoining ? "Uniendome..." : "Unirme"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <p className="typo-body m-0 text-text-secondary">
                Para confirmar el join necesitas iniciar sesion primero. Te llevamos de vuelta a esta invitacion apenas entres.
              </p>
              <div className="flex gap-2 flex-wrap">
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
