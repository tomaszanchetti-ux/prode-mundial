"use client";

import { useEffect } from "react";
import { Button } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function InstallIOSModal({ isOpen, onClose }: Props) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const tr = <T,>(es: T, en: T): T => (locale === "en" ? en : es);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isOpen) return;
    document.body.classList.add("prediction-modal-open");
    return () => {
      document.body.classList.remove("prediction-modal-open");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-ios-modal-title"
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] max-h-[92vh] overflow-y-auto card-base grid gap-4 shadow-modal rounded-xl modal-content-bg modal-sheet-enter p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="grid gap-1">
            <h2
              id="install-ios-modal-title"
              className="typo-h3 m-0 text-text-primary"
            >
              {t("Instalá Prode en tu iPhone", "Install Prode on your iPhone")}
            </h2>
            <p className="typo-small m-0 text-text-secondary">
              {t(
                "Seguí estos 3 pasos desde Safari.",
                "Follow these 3 steps from Safari."
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("Cerrar", "Close")}
            onClick={onClose}
            className="close-btn"
          >
            <span
              aria-hidden="true"
              className="block text-[18px] leading-none font-light"
            >
              ×
            </span>
          </button>
        </div>

        <ol className="grid gap-3 m-0 p-0 list-none">
          <Step
            n={1}
            icon={<ShareIcon />}
            text={tr(
              <>
                Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari.
              </>,
              <>
                Tap the <strong>Share</strong> button in Safari&apos;s bottom bar.
              </>
            )}
          />
          <Step
            n={2}
            icon={<PlusIcon />}
            text={tr(
              <>
                Desplazate y elegí <strong>Agregar a pantalla de inicio</strong>.
              </>,
              <>
                Scroll and pick <strong>Add to Home Screen</strong>.
              </>
            )}
          />
          <Step
            n={3}
            icon={<CheckIcon />}
            text={tr(
              <>
                Tocá <strong>Agregar</strong> arriba a la derecha. ¡Listo!
              </>,
              <>
                Tap <strong>Add</strong> in the top right. Done!
              </>
            )}
          />
        </ol>

        <div className="p-[14px] surface-inset text-text-secondary text-[13px] leading-[1.45]">
          {tr(
            <>
              <strong className="text-text-primary">Importante:</strong> si no ves el botón Compartir, asegurate de estar usando <strong>Safari</strong> (no Chrome ni Firefox en iOS).
            </>,
            <>
              <strong className="text-text-primary">Note:</strong> if you don&apos;t see the Share button, make sure you&apos;re using <strong>Safari</strong> (not Chrome or Firefox on iOS).
            </>
          )}
        </div>

        <Button variant="primary" onClick={onClose}>
          {t("Entendido", "Got it")}
        </Button>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  text
}: {
  n: number;
  icon: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-primary-500 text-white text-[13px] font-semibold">
        {n}
      </span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="shrink-0 text-text-primary" aria-hidden>
          {icon}
        </span>
        <span className="typo-body text-text-primary m-0 leading-snug">
          {text}
        </span>
      </div>
    </li>
  );
}

function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
