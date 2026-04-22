"use client";

import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  type ConsentDecision,
  type ConsentState,
  allAcceptedConsent,
  allDeniedConsent
} from "@prode/shared";
import { readConsent, writeConsent } from "./consent-storage";
import { updateGoogleConsent } from "./google-consent";

type ConsentPartial = {
  analytics?: ConsentDecision;
  ads?: ConsentDecision;
};

type ConsentContextValue = {
  state: ConsentState | null;
  hasDecided: boolean;
  hydrated: boolean;
  acceptAll: () => ConsentState;
  rejectAll: () => ConsentState;
  updateConsent: (partial: ConsentPartial) => ConsentState;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ConsentState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readConsent();
    setState(initial);
    setHydrated(true);
    if (initial) {
      updateGoogleConsent(initial);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== CONSENT_STORAGE_KEY) return;
      const next = readConsent();
      setState(next);
      if (next) {
        updateGoogleConsent(next);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: ConsentState) => {
    writeConsent(next);
    setState(next);
    updateGoogleConsent(next);
    return next;
  }, []);

  const acceptAll = useCallback(() => persist(allAcceptedConsent()), [persist]);
  const rejectAll = useCallback(() => persist(allDeniedConsent()), [persist]);

  const updateConsent = useCallback(
    (partial: ConsentPartial) => {
      const base = state ?? allDeniedConsent();
      const next: ConsentState = {
        version: CONSENT_VERSION,
        decidedAt: new Date().toISOString(),
        analytics: partial.analytics ?? base.analytics,
        ads: partial.ads ?? base.ads
      };
      return persist(next);
    },
    [persist, state]
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      state,
      hasDecided: hydrated && state !== null,
      hydrated,
      acceptAll,
      rejectAll,
      updateConsent
    }),
    [state, hydrated, acceptAll, rejectAll, updateConsent]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}
