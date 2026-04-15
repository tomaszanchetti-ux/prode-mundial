"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@prode/ui";
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
        <span className="typo-small text-primary-500">INVITE LINK</span>
        <h1 className="typo-h1 m-0 text-text-primary">{preview?.name ?? "Liga privada"}</h1>
        <p className="typo-body m-0 text-text-secondary max-w-[560px]">
          Entra a esta liga y compite dentro de una tabla cerrada. Si ya tienes sesión, puedes confirmar el join desde aquí mismo.
        </p>
      </Card>

      {errorMessage ? (
        <Card elevated className="gap-3">
          <p className="typo-body m-0 text-text-primary">{errorMessage}</p>
          <Button variant="ghost" onClick={() => setReloadKey((value) => value + 1)}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated className="gap-2">
          <div className="w-24 h-2.5 rounded-pill bg-[rgba(148,163,184,0.16)]" />
          <div className="w-full h-24 rounded-2xl bg-[rgba(255,255,255,0.03)]" />
        </Card>
      ) : null}

      {preview ? (
        <Card elevated className="gap-4 p-6">
          <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            <div className="p-3 rounded-md border border-border-default bg-[rgba(255,255,255,0.03)]">
              <span className="typo-small text-text-muted">Jugadores</span>
              <p className="mt-2 mb-0 text-text-primary font-bold">{preview.membersCount}</p>
            </div>
            <div className="p-3 rounded-md border border-border-default bg-[rgba(255,255,255,0.03)]">
              <span className="typo-small text-text-muted">Limite</span>
              <p className="mt-2 mb-0 text-text-primary font-bold">{preview.memberLimit}</p>
            </div>
            <div className="p-3 rounded-md border border-border-default bg-[rgba(255,255,255,0.03)]">
              <span className="typo-small text-text-muted">Estado</span>
              <p className="mt-2 mb-0 text-text-primary font-bold">{preview.isActive ? "Activa" : "Inactiva"}</p>
            </div>
          </div>

          {status === "authenticated" ? (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => void handleJoin()} disabled={isJoining}>
                {isJoining ? "Uniendome..." : "Unirme a esta liga"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/leagues")}>
                Ir a mis ligas
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
