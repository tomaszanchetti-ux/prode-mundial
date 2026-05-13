"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

export function UpgradeSuccessScreen() {
  const { profile, refreshProfile } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const [isPolling, setIsPolling] = useState(true);
  const [pollAttempts, setPollAttempts] = useState(0);

  // The Stripe webhook may land a beat after the user is redirected here. Poll
  // the profile a few times (up to ~10s) to give it time to flip plan=gold.
  useEffect(() => {
    if (profile?.plan === "gold") {
      setIsPolling(false);
      return;
    }
    if (pollAttempts >= 5) {
      setIsPolling(false);
      return;
    }
    const timer = setTimeout(async () => {
      await refreshProfile();
      setPollAttempts((current) => current + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [profile?.plan, pollAttempts, refreshProfile]);

  const isGoldConfirmed = profile?.plan === "gold";

  return (
    <div className="grid gap-4">
      <Card elevated className="league-action-bg" style={{ gap: 12, padding: 24, textAlign: "center" }}>
        <div className="text-[48px] leading-none">{isGoldConfirmed ? "✅" : "⏳"}</div>
        <h1 className="typo-h1 m-0 text-text-primary">
          {isGoldConfirmed
            ? t("¡Bienvenido a Gold!", "Welcome to Gold!")
            : t("Procesando tu pago…", "Processing your payment…")}
        </h1>
        <p className="text-[14px] leading-[1.5] text-text-secondary m-0">
          {isGoldConfirmed
            ? t(
                "Tu cuenta es Gold. Ya podés crear y unirte a ligas sin límite.",
                "Your account is Gold. You can create and join unlimited leagues now."
              )
            : isPolling
              ? t(
                  "Stripe confirmó el pago. Estamos activando Gold en tu cuenta — esto puede tardar unos segundos.",
                  "Stripe confirmed your payment. We are enabling Gold on your account — this may take a few seconds."
                )
              : t(
                  "El pago se procesó pero todavía no vemos Gold activo. Refrescá esta página en un minuto.",
                  "Payment processed but Gold is not active yet. Please refresh in a minute."
                )}
        </p>
      </Card>

      <Card elevated style={{ gap: 10, padding: 16, alignItems: "center" }}>
        <Link href="/leagues" className="w-full">
          <Button variant="primary" className="w-full">
            {t("Ir a mis ligas", "Go to my leagues")}
          </Button>
        </Link>
        <Link href="/profile#planes" className="w-full">
          <Button variant="ghost" className="w-full">
            {t("Ver mi perfil", "View my profile")}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
