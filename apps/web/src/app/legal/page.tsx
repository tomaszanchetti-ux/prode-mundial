"use client";

import React, { useEffect, useState } from "react";
import { Button, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { SupportNav } from "@/components/layout/support-nav";
import { openConsentPreferences } from "@/lib/consent/consent-events";

type LegalTab = "summary" | "terms" | "payments" | "privacy" | "cookies";

const HASH_TO_TAB: Record<string, LegalTab> = {
  "#pagos": "payments",
  "#payments": "payments",
  "#refunds": "payments",
  "#reembolsos": "payments",
  "#terminos": "terms",
  "#terms": "terms",
  "#privacy": "privacy",
  "#privacidad": "privacy",
  "#cookies": "cookies"
};

export default function LegalPage() {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const [activeTab, setActiveTab] = useState<LegalTab>("summary");

  // Permite linkear directo a una tab desde URLs externas (ej. Stripe Dashboard
  // → Public details → Refund policy URL: prodemundial.org/legal#pagos).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialTab = HASH_TO_TAB[window.location.hash.toLowerCase()];
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, []);

  const tabs: Array<{ key: LegalTab; label: string }> = [
    { key: "summary", label: t("Resumen", "Summary") },
    { key: "terms", label: t("Términos", "Terms") },
    { key: "payments", label: t("Pagos", "Payments") },
    { key: "privacy", label: t("Privacidad", "Privacy") },
    { key: "cookies", label: t("Cookies", "Cookies") }
  ];

  return (
    <main className="max-w-[920px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <Card elevated className="gap-3 p-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <span className="typo-eyebrow text-primary-500">
            {t("TÉRMINOS Y PRIVACIDAD", "TERMS & PRIVACY")}
          </span>
          <LanguageToggle />
        </div>
        <h1 className="typo-h2 m-0 text-text-primary">
          {t("Términos y Privacidad", "Terms & Privacy")}
        </h1>
        <p className="typo-body m-0 text-text-secondary max-w-[680px]">
          {t(
            "Transparencia total sobre cómo funciona el juego y tus datos.",
            "Full transparency on how the game and your data work."
          )}
        </p>
      </Card>

      <div role="tablist" aria-label={t("Secciones legales", "Legal sections")} className="legal-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className="legal-tab"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "summary" ? <SummarySection t={t} /> : null}
      {activeTab === "terms" ? <TermsSection t={t} /> : null}
      {activeTab === "payments" ? <PaymentsSection t={t} /> : null}
      {activeTab === "privacy" ? <PrivacySection t={t} /> : null}
      {activeTab === "cookies" ? <CookiesSection t={t} /> : null}

      <Card elevated className="legal-callout-warning gap-2 p-5">
        <span className="typo-eyebrow">
          {t("⚠️ NO ES UNA PLATAFORMA DE APUESTAS", "⚠️ NOT A BETTING PLATFORM")}
        </span>
        <p className="legal-section m-0 text-[14px] leading-[1.55] text-text-secondary">
          {t(
            "Prode Mundial no permite apuestas, depósitos ni transacciones económicas dentro de la aplicación. Su uso es exclusivamente recreativo. Cualquier dinámica con premios es externa a la plataforma.",
            "Prode Mundial does not allow bets, deposits or economic transactions within the app. Its use is strictly recreational. Any prize dynamic happens outside the platform."
          )}
        </p>
      </Card>

      <SupportNav sticky />
    </main>
  );
}

type Copy = (es: string, en: string) => string;

function SummarySection({ t }: { t: Copy }) {
  return (
    <Card elevated className="gap-4 p-5">
      <div className="grid gap-1">
        <span className="typo-eyebrow">{t("RESUMEN", "SUMMARY")}</span>
        <h2 className="typo-h3 m-0 text-text-primary">
          {t("Lo importante, en 10 segundos", "The key points, in 10 seconds")}
        </h2>
      </div>

      <div className="grid gap-4 legal-section">
        <div className="grid gap-1">
          <h3>{t("Qué es esto", "What this is")}</h3>
          <p>
            {t(
              "Un juego de predicciones deportivas sin apuestas dentro de la app.",
              "A sports prediction game with no in-app betting."
            )}
          </p>
        </div>
        <div className="grid gap-1">
          <h3>{t("Dinero y premios", "Money and prizes")}</h3>
          <p>
            {t(
              "La app no gestiona dinero ni premios. Cualquier premio se organiza fuera de la plataforma.",
              "The app does not manage money or prizes. Any prize is arranged off-platform."
            )}
          </p>
        </div>
        <div className="grid gap-1">
          <h3>{t("Tus datos", "Your data")}</h3>
          <p>
            {t(
              "Solo usamos los datos necesarios para que el juego funcione. Nunca vendemos tu información.",
              "We only use the data needed to run the game. We never sell your information."
            )}
          </p>
        </div>
        <div className="grid gap-1">
          <h3>{t("Responsabilidad", "Responsibility")}</h3>
          <p>
            {t(
              "Es un juego recreativo. No garantizamos resultados ni disponibilidad continua.",
              "This is a recreational game. We do not guarantee results or continuous availability."
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

function TermsSection({ t }: { t: Copy }) {
  return (
    <Card elevated className="gap-4 p-5">
      <div className="grid gap-1">
        <span className="typo-eyebrow">{t("📜 TÉRMINOS DE USO", "📜 TERMS OF USE")}</span>
        <h2 className="typo-h3 m-0 text-text-primary">
          {t("Condiciones del juego", "Game conditions")}
        </h2>
      </div>

      <div className="grid gap-4 legal-section">
        <div className="grid gap-1">
          <h3>{t("1. Naturaleza del producto", "1. Product nature")}</h3>
          <p>
            {t(
              "Prode Mundial es un juego de predicción deportiva con fines recreativos. No constituye una plataforma de apuestas ni de juego con dinero real.",
              "Prode Mundial is a sports prediction game for recreational purposes. It is not a betting platform or a real-money gaming service."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("2. Uso permitido", "2. Permitted use")}</h3>
          <p>
            {t(
              "Podés usar la aplicación únicamente con fines personales y recreativos. No está permitido:",
              "You may only use the app for personal and recreational purposes. The following are not allowed:"
            )}
          </p>
          <ul>
            <li>{t("Uso fraudulento", "Fraudulent use")}</li>
            <li>{t("Manipulación de resultados", "Result manipulation")}</li>
            <li>{t("Uso automatizado (bots)", "Automated use (bots)")}</li>
          </ul>
        </div>

        <div className="grid gap-1">
          <h3>{t("3. Premios y dinero", "3. Prizes and money")}</h3>
          <p>
            {t(
              "Prode Mundial no gestiona dinero, apuestas ni premios económicos dentro de la plataforma. Cualquier premio asociado al juego es definido y entregado por terceros (ej: amigos, empresas) fuera de la aplicación. La plataforma no participa, intermedia ni garantiza dichos premios.",
              "Prode Mundial does not manage money, bets or monetary prizes within the platform. Any prize tied to the game is defined and delivered by third parties (e.g. friends, companies) outside the app. The platform does not participate, mediate or guarantee such prizes."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("4. Disponibilidad", "4. Availability")}</h3>
          <p>
            {t(
              "Nos esforzamos por mantener la aplicación disponible, pero no garantizamos funcionamiento ininterrumpido.",
              "We work to keep the app available, but we do not guarantee uninterrupted operation."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("5. Modificaciones", "5. Modifications")}</h3>
          <p>
            {t(
              "Podemos actualizar reglas o funcionalidades en cualquier momento.",
              "We may update rules or features at any time."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("6. Limitación de responsabilidad", "6. Limitation of liability")}</h3>
          <p>{t("No somos responsables por:", "We are not responsible for:")}</p>
          <ul>
            <li>{t("Pérdidas indirectas", "Indirect losses")}</li>
            <li>{t("Decisiones tomadas en base al juego", "Decisions taken based on the game")}</li>
            <li>{t("Fallos técnicos externos", "External technical failures")}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

function PaymentsSection({ t }: { t: Copy }) {
  return (
    <Card elevated className="gap-4 p-5">
      <div className="grid gap-1">
        <span className="typo-eyebrow">{t("💳 PAGOS Y REEMBOLSOS", "💳 PAYMENTS & REFUNDS")}</span>
        <h2 className="typo-h3 m-0 text-text-primary">
          {t("Plan Gold y política de reembolsos", "Gold plan and refund policy")}
        </h2>
      </div>

      <div className="grid gap-4 legal-section">
        <div className="grid gap-1">
          <h3>{t("1. Plan Gold", "1. Gold plan")}</h3>
          <p>
            {t(
              "El plan Gold es un pago único de $5 USD que da acceso a ligas ilimitadas y experiencia sin anuncios durante todo el ciclo del Mundial 2026. No es una suscripción recurrente: no se renueva automáticamente ni se cobra de nuevo al finalizar el torneo.",
              "Gold is a one-time payment of $5 USD that grants unlimited leagues and an ad-free experience for the full World Cup 2026 cycle. It is not a recurring subscription: it does not auto-renew and is not charged again after the tournament."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("2. Procesamiento del pago", "2. Payment processing")}</h3>
          <p>
            {t(
              "Los pagos se procesan a través de Stripe, un proveedor PCI DSS Level 1 certificado. Prode Mundial no almacena ni accede a los datos de tu tarjeta. Recibimos solo la confirmación del pago.",
              "Payments are processed through Stripe, a PCI DSS Level 1 certified provider. Prode Mundial does not store or access your card details. We only receive the payment confirmation."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3 id="refunds">{t("3. Reembolsos", "3. Refunds")}</h3>
          <p>
            {t(
              "El plan Gold es un pago único por un servicio digital de acceso inmediato. Al completar el pago, aceptás expresamente que el servicio comienza a ejecutarse y renunciás al derecho de desistimiento de 14 días previsto por la normativa de consumo de la UE (Directiva 2011/83/UE, art. 16.m).",
              "Gold is a one-time payment for an immediately accessible digital service. By completing the purchase you expressly accept that the service starts executing and you waive the 14-day right of withdrawal granted by EU consumer law (Directive 2011/83/EU, art. 16.m)."
            )}
          </p>
          <p>
            {t(
              "Aun así, reembolsamos íntegramente en los siguientes casos:",
              "Even so, we issue a full refund in the following cases:"
            )}
          </p>
          <ul>
            <li>
              {t(
                "Cobro duplicado: dos o más cargos por el mismo pago.",
                "Duplicate charge: two or more charges for the same payment."
              )}
            </li>
            <li>
              {t(
                "Error técnico verificable que impida usar el servicio Gold durante más de 48 horas.",
                "Verifiable technical error preventing use of the Gold service for more than 48 hours."
              )}
            </li>
            <li>
              {t(
                "Cargo no autorizado o fraude reportado dentro de los 30 días.",
                "Unauthorized charge or fraud reported within 30 days."
              )}
            </li>
          </ul>
          <p>
            {t(
              "Las solicitudes de reembolso deben enviarse a hola@prode-mundial.app dentro de los 7 días desde el cobro, incluyendo el email de la cuenta y el ID de la transacción (recibo de Stripe). Procesamos el reembolso dentro de los 7 días hábiles desde la aprobación; el dinero puede tardar 5-10 días adicionales en aparecer en tu cuenta según tu banco.",
              "Refund requests must be sent to hola@prode-mundial.app within 7 days of the charge, including the account email and the transaction ID (Stripe receipt). We process approved refunds within 7 business days; the money may take an additional 5-10 days to appear in your account depending on your bank."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("4. Disputas (chargebacks)", "4. Disputes (chargebacks)")}</h3>
          <p>
            {t(
              "Si tenés un problema con un cargo, escribinos primero a hola@prode-mundial.app antes de iniciar una disputa con tu banco. Es lo más rápido y siempre intentamos resolver de buena fe. Las disputas iniciadas sin contacto previo pueden resultar en la suspensión de la cuenta mientras se resuelve el caso.",
              "If you have an issue with a charge, please write to hola@prode-mundial.app before initiating a dispute with your bank. It's the fastest path and we always try to resolve in good faith. Disputes opened without prior contact may result in the account being suspended while the case is resolved."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("5. Impuestos (IVA)", "5. Taxes (VAT)")}</h3>
          <p>
            {t(
              "El precio de $5 USD incluye el IVA aplicable según tu país de residencia (21% en España). Si necesitás una factura con tu NIF/CIF para deducir IVA como empresa o autónomo, escribinos a hola@prode-mundial.app dentro de los 30 días del cobro.",
              "The $5 USD price includes applicable VAT according to your country of residence (21% in Spain). If you need an invoice with your VAT number to deduct VAT as a company or freelancer, write to hola@prode-mundial.app within 30 days of the charge."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("6. Cambios al plan", "6. Plan changes")}</h3>
          <p>
            {t(
              "Si en algún momento modificamos el alcance del plan Gold (features incluidas, precio, etc.), los cambios solo aplicarán a nuevas compras. Quienes ya hayan comprado Gold mantienen las condiciones vigentes al momento del pago hasta el final del Mundial 2026.",
              "If at any point we modify the scope of the Gold plan (included features, pricing, etc.), the changes only apply to new purchases. Users who already bought Gold keep the conditions in effect at the time of payment until the end of the World Cup 2026."
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

function PrivacySection({ t }: { t: Copy }) {
  return (
    <Card elevated className="gap-4 p-5">
      <div className="grid gap-1">
        <span className="typo-eyebrow">{t("🔐 PRIVACIDAD (GDPR)", "🔐 PRIVACY (GDPR)")}</span>
        <h2 className="typo-h3 m-0 text-text-primary">{t("Tus datos", "Your data")}</h2>
      </div>

      <div className="grid gap-4 legal-section">
        <div className="grid gap-1">
          <h3>{t("1. Datos que recopilamos", "1. Data we collect")}</h3>
          <p>
            {t(
              "Recopilamos únicamente los datos necesarios para operar el juego:",
              "We only collect the data needed to run the game:"
            )}
          </p>
          <ul>
            <li>{t("Nombre", "Name")}</li>
            <li>{t("Email", "Email")}</li>
            <li>{t("Predicciones", "Predictions")}</li>
            <li>{t("Actividad dentro del juego", "In-game activity")}</li>
          </ul>
        </div>

        <div className="grid gap-1">
          <h3>{t("2. Cómo usamos los datos", "2. How we use data")}</h3>
          <p>{t("Usamos tus datos para:", "We use your data to:")}</p>
          <ul>
            <li>{t("Gestionar tu cuenta", "Manage your account")}</li>
            <li>{t("Calcular resultados y rankings", "Compute results and standings")}</li>
            <li>{t("Mejorar la experiencia", "Improve the experience")}</li>
          </ul>
        </div>

        <div className="grid gap-1">
          <h3>{t("3. Base legal (GDPR)", "3. Legal basis (GDPR)")}</h3>
          <p>
            {t(
              "Tratamos tus datos bajo las siguientes bases legales: ejecución del servicio e interés legítimo (mejoras del producto).",
              "We process your data under the following legal bases: service execution and legitimate interest (product improvements)."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("4. Compartición de datos", "4. Data sharing")}</h3>
          <p>
            {t(
              "No vendemos ni compartimos tus datos con terceros, excepto cuando es necesario para operar el servicio (ej: infraestructura cloud).",
              "We do not sell or share your data with third parties, except when necessary to operate the service (e.g. cloud infrastructure)."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("5. Retención", "5. Retention")}</h3>
          <p>
            {t(
              "Conservamos tus datos mientras tengas una cuenta activa o sea necesario para el funcionamiento del servicio.",
              "We retain your data while you have an active account or as needed to run the service."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("6. Tus derechos", "6. Your rights")}</h3>
          <p>{t("Tenés derecho a:", "You have the right to:")}</p>
          <ul>
            <li>{t("Acceder a tus datos", "Access your data")}</li>
            <li>{t("Rectificarlos", "Rectify them")}</li>
            <li>{t("Eliminarlos", "Erase them")}</li>
            <li>{t("Solicitar portabilidad", "Request portability")}</li>
          </ul>
          <p>
            {t(
              "Podés ejercer estos derechos escribiendo a hola@prode-mundial.app.",
              "You can exercise these rights by writing to hola@prode-mundial.app."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("7. Seguridad", "7. Security")}</h3>
          <p>
            {t(
              "Implementamos medidas técnicas y organizativas para proteger tus datos.",
              "We implement technical and organizational measures to protect your data."
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

function CookiesSection({ t }: { t: Copy }) {
  return (
    <Card elevated className="gap-4 p-5">
      <div className="grid gap-1">
        <span className="typo-eyebrow">{t("🍪 COOKIES", "🍪 COOKIES")}</span>
        <h2 className="typo-h3 m-0 text-text-primary">
          {t("Política de cookies", "Cookie policy")}
        </h2>
      </div>

      <div className="grid gap-4 legal-section">
        <div className="grid gap-1">
          <h3>{t("Qué son las cookies", "What cookies are")}</h3>
          <p>
            {t(
              "Pequeños archivos que guardamos en tu dispositivo para que la app recuerde tu sesión, tus preferencias y, si lo permitís, para entender cómo se usa.",
              "Small files stored on your device so the app remembers your session, preferences, and — if you allow it — how it's used."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("Categorías que usamos", "Categories we use")}</h3>
          <ul>
            <li>
              <strong>{t("Necesarias", "Essential")}</strong>
              {t(
                " — Firebase Auth (sesión), preferencia de idioma, consentimiento de cookies y tokens de notificación push (si activás notificaciones). Siempre activas.",
                " — Firebase Auth (session), language preference, cookie consent, and push notification tokens (if you enable notifications). Always active."
              )}
            </li>
            <li>
              <strong>{t("Analíticas", "Analytics")}</strong>
              {t(
                " — Firebase Analytics (Google) para medir uso agregado. Solo con tu permiso.",
                " — Firebase Analytics (Google) to measure aggregate usage. Only with your consent."
              )}
            </li>
            <li>
              <strong>{t("Marketing", "Marketing")}</strong>
              {t(
                " — Google AdSense para anuncios personalizados en el tier gratuito. Solo con tu permiso.",
                " — Google AdSense for personalized ads on the free tier. Only with your consent."
              )}
            </li>
          </ul>
        </div>

        <div className="grid gap-1">
          <h3>{t("Cómo retiramos el consentimiento", "How to withdraw consent")}</h3>
          <p>
            {t(
              "Podés cambiar tus preferencias en cualquier momento desde este panel. Tu navegador también te permite borrar cookies manualmente.",
              "You can change your preferences any time from this panel. Your browser also lets you delete cookies manually."
            )}
          </p>
        </div>

        <div className="grid gap-1">
          <h3>{t("Terceros", "Third parties")}</h3>
          <p>
            {t(
              "Google Firebase (autenticación, analítica, notificaciones) y, en el tier gratuito, Google AdSense. No usamos cookies de marketing de redes sociales.",
              "Google Firebase (auth, analytics, notifications) and, on the free tier, Google AdSense. We don't use social-media marketing cookies."
            )}
          </p>
        </div>
      </div>

      <div className="pt-1">
        <Button onClick={openConsentPreferences}>
          {t("Gestionar preferencias", "Manage preferences")}
        </Button>
      </div>
    </Card>
  );
}
