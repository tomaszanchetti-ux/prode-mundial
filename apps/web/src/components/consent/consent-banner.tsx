"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@prode/ui";
import type { ConsentDecision, ConsentState } from "@prode/shared";
import { useConsent } from "@/lib/consent/consent-provider";
import { CONSENT_OPEN_PREFERENCES_EVENT } from "@/lib/consent/consent-events";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type PreferencesDraft = {
  analytics: ConsentDecision;
  ads: ConsentDecision;
};

function draftFromState(state: ConsentState | null): PreferencesDraft {
  return {
    analytics: state?.analytics ?? "denied",
    ads: state?.ads ?? "denied"
  };
}

export function ConsentBanner() {
  const { state, hydrated, acceptAll, rejectAll, updateConsent } = useConsent();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<PreferencesDraft>(() => draftFromState(state));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      setDraft(draftFromState(state));
      setIsModalOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_PREFERENCES_EVENT, onOpen);
  }, [state]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isModalOpen) return;
    document.body.classList.add("prediction-modal-open");
    return () => {
      document.body.classList.remove("prediction-modal-open");
    };
  }, [isModalOpen]);

  const openModal = useCallback(() => {
    setDraft(draftFromState(state));
    setIsModalOpen(true);
  }, [state]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleAcceptAll = useCallback(() => {
    acceptAll();
    setIsModalOpen(false);
  }, [acceptAll]);

  const handleRejectAll = useCallback(() => {
    rejectAll();
    setIsModalOpen(false);
  }, [rejectAll]);

  const handleSavePreferences = useCallback(() => {
    updateConsent(draft);
    setIsModalOpen(false);
  }, [draft, updateConsent]);

  const toggle = useCallback((category: keyof PreferencesDraft) => {
    setDraft((current) => ({
      ...current,
      [category]: current[category] === "accepted" ? "denied" : "accepted"
    }));
  }, []);

  const showBanner = hydrated && state === null;

  return (
    <>
      {showBanner ? (
        <div
          className="consent-banner"
          role="region"
          aria-label={t("Consentimiento de cookies", "Cookie consent")}
        >
          <Card elevated className="consent-banner-card gap-3 p-4">
            <p className="typo-body m-0 text-text-primary">
              {t(
                "Usamos cookies para mejorar tu experiencia. Podés aceptar, rechazar o configurar tu elección.",
                "We use cookies to improve your experience. You can accept, reject or customize your choice."
              )}
            </p>
            <div className="consent-banner-actions">
              <Button onClick={handleAcceptAll}>
                {t("Aceptar todo", "Accept all")}
              </Button>
              <Button variant="secondary" onClick={handleRejectAll}>
                {t("Rechazar todo", "Reject all")}
              </Button>
              <button
                type="button"
                onClick={openModal}
                className="consent-banner-link"
              >
                {t("Configurar", "Customize")}
              </button>
            </div>
          </Card>
        </div>
      ) : null}

      {isModalOpen ? (
        <ConsentPreferencesModal
          draft={draft}
          onToggle={toggle}
          onClose={closeModal}
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onSave={handleSavePreferences}
          t={t}
        />
      ) : null}
    </>
  );
}

type ModalProps = {
  draft: PreferencesDraft;
  onToggle: (category: keyof PreferencesDraft) => void;
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: () => void;
  t: (es: string, en: string) => string;
};

function ConsentPreferencesModal({
  draft,
  onToggle,
  onClose,
  onAcceptAll,
  onRejectAll,
  onSave,
  t
}: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
    >
      <div className="w-full max-w-[480px] max-h-[92vh] overflow-y-auto card-base grid gap-4 shadow-modal rounded-xl modal-content-bg modal-sheet-enter p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="grid gap-1">
            <h2 id="consent-modal-title" className="typo-h3 m-0 text-text-primary">
              {t("Configuración de cookies", "Cookie settings")}
            </h2>
            <p className="typo-small m-0 text-text-secondary">
              {t("Elegí qué cookies querés permitir.", "Choose which cookies to allow.")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("Cerrar", "Close")}
            onClick={onClose}
            className="close-btn"
          >
            <span aria-hidden="true" className="block text-[18px] leading-none font-light">
              ×
            </span>
          </button>
        </div>

        <div className="grid gap-2.5">
          <ConsentRow
            title={t("Necesarias", "Essential")}
            hint={t("(siempre activas)", "(always active)")}
            description={t(
              "Necesarias para que la app funcione.",
              "Required for the app to work."
            )}
            value="accepted"
            locked
            t={t}
          />
          <ConsentRow
            title={t("Analíticas", "Analytics")}
            description={t(
              "Nos ayudan a entender el uso de la app.",
              "Help us understand how the app is used."
            )}
            value={draft.analytics}
            onToggle={() => onToggle("analytics")}
            t={t}
          />
          <ConsentRow
            title={t("Marketing", "Marketing")}
            description={t(
              "Usadas para contenido personalizado.",
              "Used for personalized content."
            )}
            value={draft.ads}
            onToggle={() => onToggle("ads")}
            t={t}
          />
        </div>

        <div className="consent-modal-actions">
          <Button onClick={onSave}>
            {t("Guardar selección", "Save selection")}
          </Button>
          <Button variant="secondary" onClick={onAcceptAll}>
            {t("Aceptar todo", "Accept all")}
          </Button>
          <button
            type="button"
            onClick={onRejectAll}
            className="consent-banner-link"
          >
            {t("Rechazar todo", "Reject all")}
          </button>
        </div>
      </div>
    </div>
  );
}

type ConsentRowProps = {
  title: string;
  hint?: string;
  description: string;
  value: ConsentDecision;
  locked?: boolean;
  onToggle?: () => void;
  t: (es: string, en: string) => string;
};

function ConsentRow({ title, hint, description, value, locked = false, onToggle, t }: ConsentRowProps) {
  const checked = value === "accepted";

  const content = (
    <>
      <div className="consent-row-copy">
        <h3 className="m-0 text-[15px] font-semibold text-text-primary">
          {title}
          {hint ? <span className="consent-row-hint"> {hint}</span> : null}
        </h3>
        <p className="typo-small m-0 text-text-secondary">{description}</p>
      </div>
      <span
        className="consent-switch"
        data-checked={checked}
        data-locked={locked}
        aria-hidden="true"
      >
        <span className="consent-switch-thumb" />
      </span>
      <span className="sr-only">
        {locked
          ? t("Siempre activo", "Always on")
          : checked
            ? t("Activo", "On")
            : t("Inactivo", "Off")}
      </span>
    </>
  );

  if (locked) {
    return <div className="consent-row consent-row--locked">{content}</div>;
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      onClick={onToggle}
      className="consent-row consent-row--interactive"
    >
      {content}
    </button>
  );
}
