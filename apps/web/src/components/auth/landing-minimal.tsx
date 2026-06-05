"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { LoginBlock } from "./login-block";
import { resolveNextRoute } from "./login-screen";
import { SupportNav } from "@/components/layout/support-nav";

/**
 * Home pública pre-auth (EPIC 23bis).
 * Hero dark stadium + login block como CTA único.
 */
export function LandingMinimal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, status } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(searchParams.get("next"), profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, searchParams, status]);

  return (
    <main className="landing-bg-dark min-h-[100dvh] grid grid-rows-[1fr_auto] px-6">
      <div className="flex flex-col items-center justify-center gap-10 py-10 max-w-[420px] mx-auto w-full">
        <div className="grid gap-3 text-center">
          <h1 className="landing-title">
            {locale === "en" ? (
              <>
                Your World Cup is
                <br />
                waiting.
              </>
            ) : (
              <>
                Tu Mundial te está
                <br />
                esperando.
              </>
            )}
          </h1>
          <p className="landing-subtitle">{t("Cada predicción cuenta.", "Every prediction counts.")}</p>
        </div>

        <LoginBlock />
      </div>

      <footer className="flex justify-center py-6">
        <SupportNav variant="footer" />
      </footer>
    </main>
  );
}
