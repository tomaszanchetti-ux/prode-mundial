"use client";

import React, { useEffect, useState } from "react";
import { Button, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { track } from "@/lib/firebase/analytics";
import { hasSeenAdvancerBanner, markAdvancerBannerSeen } from "@/lib/matches/advancer-banner-tracker";

/**
 * Aviso único sobre la nueva mecánica de cruces: al empatar elegís quién pasa
 * y sumás +1. Invita a revisar las predicciones de cruces ya cargadas.
 * "Entendido" lo descarta para siempre (localStorage, sin tocar la DB).
 */
export function AdvancerChangesBanner() {
  const { locale } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasSeenAdvancerBanner()) {
      setShow(true);
      track("advancer_banner_shown");
    }
  }, []);

  if (!show) {
    return null;
  }

  const handleDismiss = () => {
    markAdvancerBannerSeen();
    track("advancer_banner_dismissed");
    setShow(false);
  };

  return (
    <Card className="alert-info" style={{ gap: 10, padding: 16 }}>
      <div className="grid gap-1">
        <strong className="typo-body text-text-primary">
          {copyForLocale(locale, "Novedad en los cruces", "What's new in the knockouts")}
        </strong>
        <p className="typo-small m-0 text-text-secondary">
          {copyForLocale(
            locale,
            "Ahora, cuando predecís un empate en un cruce, elegís qué equipo pasa de fase. Acertar quién pasa te suma 1 punto extra. Si ya cargaste empates en cruces, revisalos para elegir quién clasifica.",
            "Now, when you predict a draw in a knockout, you choose which team advances. Guessing who advances earns you 1 extra point. If you already saved draws in knockouts, review them to pick who qualifies."
          )}
        </p>
      </div>
      <div className="flex">
        <Button variant="primary" onClick={handleDismiss}>
          {copyForLocale(locale, "Entendido", "Got it")}
        </Button>
      </div>
    </Card>
  );
}
