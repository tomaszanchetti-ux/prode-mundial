"use client";

import React from "react";
import { useEffect } from "react";
import { APP_ROUTES } from "@prode/shared";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { SupportNav } from "@/components/layout/support-nav";

// Lazy-load del form de login: chunk separado del initial bundle.
// Mientras carga mostramos un skeleton que matchea altura aprox del form
// (3 botones apilados) para evitar layout shift.
const LoginBlock = dynamic(() => import("./login-block").then((mod) => ({ default: mod.LoginBlock })), {
  ssr: false,
  loading: () => (
    <div className="w-full grid gap-3" aria-busy="true" aria-label="Cargando formulario de login">
      <div className="h-[44px] rounded-md bg-white/10 animate-pulse" />
      <div className="h-[20px] w-12 mx-auto rounded bg-white/10 animate-pulse" />
      <div className="h-[44px] rounded-md bg-white/10 animate-pulse" />
      <div className="h-[44px] rounded-md bg-white/10 animate-pulse" />
    </div>
  )
});

export function resolveNextRoute(next: string | null, profileCompleted: boolean | undefined) {
  if (profileCompleted === false) {
    return APP_ROUTES.profile;
  }

  return next && next.startsWith("/") ? next : APP_ROUTES.home;
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, status, isEmailLink } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(searchParams.get("next"), profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, searchParams, status]);

  // Backwards-compat: si un magic link viejo (que apuntaba a /login)
  // todavía circula, redirigimos al callback dedicado preservando los query
  // params (incluido el `oobCode` que `signInWithEmailLink` necesita).
  useEffect(() => {
    if (isEmailLink && typeof window !== "undefined") {
      router.replace(`${APP_ROUTES.authCallback}${window.location.search}`);
    }
  }, [isEmailLink, router]);

  return (
    <main className="landing-bg-dark min-h-[100dvh] grid grid-rows-[1fr_auto] px-6">
      <div className="flex flex-col items-center justify-center gap-10 py-10 max-w-[420px] mx-auto w-full">
        <div className="grid gap-3 text-center">
          <h1 className="landing-title">{t("Volvé a tu Mundial.", "Back to your World Cup.")}</h1>
          <p className="landing-subtitle">{t("Entrá para seguir jugando.", "Sign in to keep playing.")}</p>
        </div>

        <LoginBlock />
      </div>

      <footer className="flex justify-center py-6">
        <SupportNav variant="footer" />
      </footer>
    </main>
  );
}
