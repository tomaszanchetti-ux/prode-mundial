"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "es" | "en";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LOCALE_STORAGE_KEY = "prode-mundial:locale";
const LocaleContext = createContext<LocaleContextValue | null>(null);

function readInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "es";
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (stored === "es" || stored === "en") {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>("es");

  useEffect(() => {
    setLocaleState(readInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Lectura no-reactiva del locale actual, para usar fuera del árbol de React
 * (handlers async, funciones module-level que generan mensajes de error).
 * Mismo origen que el provider: localStorage → navigator → "es".
 */
export function readCurrentLocale(): AppLocale {
  return readInitialLocale();
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    return {
      locale: "es" as AppLocale,
      setLocale: () => undefined
    };
  }

  return context;
}

export function copyForLocale(locale: AppLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

export function toIntlLocale(locale: AppLocale) {
  return locale === "en" ? "en-US" : "es-AR";
}

export function formatDateTime(
  locale: AppLocale,
  iso: string,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(new Date(iso));
}
