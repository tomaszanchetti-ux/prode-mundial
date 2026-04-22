"use client";

import { useEffect } from "react";
import { initAnalytics, setAnalyticsConsent } from "@/lib/firebase/analytics";
import { useConsent } from "@/lib/consent/consent-provider";

export function AnalyticsInit() {
  const { state } = useConsent();
  const granted = state?.analytics === "accepted";

  useEffect(() => {
    setAnalyticsConsent(granted);
    if (granted) {
      void initAnalytics();
    }
  }, [granted]);

  return null;
}
