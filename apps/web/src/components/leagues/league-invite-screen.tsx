"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, SkeletonCard } from "@prode/ui";
import { APP_ROUTES } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { ApiClientError, getLeagueInvitePreview, joinLeague } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";

type InvitePreviewState = Awaited<ReturnType<typeof getLeagueInvitePreview>>;

export function LeagueInviteScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
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
        setErrorMessage(t("Falta el token de invitación.", "The invite token is missing."));
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

        setErrorMessage(
          error instanceof ApiClientError ? error.message : t("No pudimos resolver esta invitación.", "We couldn't resolve this invite.")
        );
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
          t(
            "Solo podés estar en 3 ligas a la vez. Salí de una actual para sumarte a otra o mejorá tu plan para participar en ligas ilimitadas.",
            "You can only be in 3 leagues at a time. Leave one to join another, or upgrade your plan for unlimited leagues."
          )
        );
        setErrorShowPlansCta(true);
      } else if (error instanceof ApiClientError && error.code === "LEAGUE_CAPACITY_REACHED") {
        setErrorMessage(
          t(
            "Esta liga ya alcanzó el máximo de 20 jugadores. Conocé los planes Gold y Enterprise para ligas con más cupo.",
            "This league already reached the 20-player limit. Check out the Gold and Enterprise plans for larger leagues."
          )
        );
        setErrorShowPlansCta(true);
      } else {
        setErrorMessage(
          error instanceof ApiClientError ? error.message : t("No pudimos unirte a la liga.", "We couldn't add you to the league.")
        );
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
          <span className="typo-small text-text-muted">{t("Invitación a liga privada", "Private league invite")}</span>
        </div>
        <Link href="/" className="text-text-secondary no-underline font-semibold">
          {t("Volver", "Back")}
        </Link>
      </header>

      <Card elevated className="login-hero-bg gap-4 p-6">
        <span className="typo-small text-primary-500">{t("Invitación", "Invite")}</span>
        <h1 className="typo-h1 m-0 text-text-primary">{preview?.name ?? t("Liga privada", "Private league")}</h1>
      </Card>

      {errorMessage ? (
        <Card elevated className="gap-3">
          <p className="typo-body m-0 text-text-primary">{errorMessage}</p>
          {errorShowPlansCta ? (
            <Link
              href="/profile#planes"
              className="typo-body font-bold text-primary-600 no-underline"
            >
              {t("Ver planes →", "View plans →")}
            </Link>
          ) : null}
          <Button variant="ghost" onClick={() => setReloadKey((value) => value + 1)}>
            {t("Reintentar", "Retry")}
          </Button>
        </Card>
      ) : null}

      {isLoading ? <SkeletonCard lines={2} /> : null}

      {preview ? (
        <Card elevated className="gap-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1">
              <span className="typo-meta">{t("Jugadores", "Players")}</span>
              <p className="m-0 text-[18px] leading-none text-text-primary font-bold tabular-nums">{preview.membersCount}</p>
            </div>
            <div className="grid gap-1">
              <span className="typo-meta">{t("Límite", "Limit")}</span>
              <p className="m-0 text-[18px] leading-none text-text-primary font-bold tabular-nums">{preview.memberLimit}</p>
            </div>
            <div className="grid gap-1">
              <span className="typo-meta">{t("Estado", "Status")}</span>
              <p className="m-0 text-[18px] leading-none text-text-primary font-bold">{preview.isActive ? t("Activa", "Active") : t("Inactiva", "Inactive")}</p>
            </div>
          </div>

          {status === "authenticated" ? (
            <div>
              <Button onClick={() => void handleJoin()} disabled={isJoining}>
                {isJoining ? t("Uniéndome...", "Joining...") : t("Unirme", "Join")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <p className="typo-body m-0 text-text-secondary">
                {t(
                  "Para confirmar el ingreso necesitás iniciar sesión primero. Te llevamos de vuelta a esta invitación apenas entres.",
                  "To confirm you need to sign in first. We'll bring you right back to this invite once you're in."
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => router.push(loginHref)}>{t("Entrar para unirme", "Log in to join")}</Button>
                <Button variant="ghost" onClick={() => router.push("/")}>
                  {t("Volver al inicio", "Back to home")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </main>
  );
}
