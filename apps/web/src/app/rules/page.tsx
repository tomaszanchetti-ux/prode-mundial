"use client";

import {
  CHAMPION_SCORING_RULES,
  MATCH_SCORING_RULES,
  PICK_WINDOW_POINT_VALUES,
  PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF
} from "@prode/shared";
import { Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { SupportNav } from "@/components/layout/support-nav";

export default function RulesPage() {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  return (
    <main className="max-w-[920px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <Card elevated className="rules-hero-bg gap-3 p-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <span className="typo-eyebrow text-primary-500">{t("REGLAS", "RULES")}</span>
          <LanguageToggle />
        </div>
        <h1 className="typo-h2 m-0 text-text-primary">{t("Cómo se juega", "How it works")}</h1>
        <p className="typo-body m-0 text-text-secondary max-w-[680px]">
          {t("Predecí resultados, sumá puntos y ganá.", "Predict scores, earn points, win.")}
        </p>
      </Card>

      <Card elevated className="gap-4 p-5">
        <div className="grid gap-1">
          <h2 className="typo-h3 m-0 text-text-primary">{t("Puntos por partido", "Points per match")}</h2>
          <p className="typo-body m-0 text-text-secondary">
            {t("Se evalúa hasta el minuto 90.", "Evaluated up to the 90th minute.")}
          </p>
        </div>

        <div className="grid gap-2">
          <div className="rules-points-card rules-points-card-highlight">
            <span className="rules-icon" aria-hidden="true">🎯</span>
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">
                {t("Marcador exacto", "Exact score")}
              </span>
              <span className="text-[13px] text-text-secondary">
                {t("Resultado y ganador correctos", "Score and winner correct")}
              </span>
            </div>
            <span className="rules-value">+{MATCH_SCORING_RULES.exact90Points} pts</span>
          </div>
          <div className="rules-points-card">
            <span className="rules-icon" aria-hidden="true">✓</span>
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">
                {t("Resultado", "Outcome")}
              </span>
              <span className="text-[13px] text-text-secondary">
                {t("Acertás ganador o empate", "You hit the winner or the draw")}
              </span>
            </div>
            <span className="rules-value">+{MATCH_SCORING_RULES.correctOutcome90Points} pts</span>
          </div>
          <div className="rules-points-card">
            <span className="rules-icon" aria-hidden="true">✕</span>
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">{t("Error", "Miss")}</span>
              <span className="text-[13px] text-text-secondary">
                {t("No acertás", "No hit")}
              </span>
            </div>
            <span className="rules-value rules-value-muted">0 pts</span>
          </div>
        </div>
      </Card>

      <Card elevated className="gap-4 p-5">
        <div className="grid gap-1">
          <h2 className="typo-h3 m-0 text-text-primary">{t("Tus picks", "Your picks")}</h2>
          <p className="typo-body m-0 text-text-secondary">
            {t("Antes del torneo elegís tres apuestas macro.", "Before the tournament you make three macro bets.")}
          </p>
        </div>

        <div className="grid gap-2">
          <div className="rules-points-card">
            <span className="rules-icon" aria-hidden="true">🏆</span>
            <span className="text-[15px] font-semibold text-text-primary">
              {t("Campeón", "Champion")}
            </span>
            <span className="rules-value">{PICK_WINDOW_POINT_VALUES.A} pts</span>
          </div>
          <div className="rules-points-card">
            <span className="rules-icon" aria-hidden="true">🥈</span>
            <span className="text-[15px] font-semibold text-text-primary">
              {t("Subcampeón", "Runner-up")}
            </span>
            <span className="rules-value">{PICK_WINDOW_POINT_VALUES.A} pts</span>
          </div>
          <div className="rules-points-card">
            <span className="rules-icon" aria-hidden="true">⭐</span>
            <span className="text-[15px] font-semibold text-text-primary">
              {t("Balón de Oro", "Golden Ball")}
            </span>
            <span className="rules-value">{PICK_WINDOW_POINT_VALUES.A} pts</span>
          </div>
        </div>
      </Card>

      <Card elevated className="rules-callout gap-3 p-5">
        <div className="grid gap-1">
          <span className="typo-eyebrow text-primary-500">{t("AJUSTE DE PICKS", "PICK ADJUSTMENT")}</span>
          <h2 className="typo-h3 m-0 text-text-primary">
            {t("Cambiá tus picks tras la fase de grupos", "Adjust your picks after the group stage")}
          </h2>
        </div>
        <p className="typo-body m-0 text-text-secondary">
          {t(
            "Si tu Campeón, Subcampeón o Balón de Oro quedan eliminados, podés ajustar la apuesta antes del inicio de los Cruces (16vos).",
            "If your Champion, Runner-up or Golden Ball gets eliminated, you can adjust the pick before the Round of 32 kicks off."
          )}
        </p>
        <div className="rules-points-card">
          <span className="rules-icon" aria-hidden="true">⚡</span>
          <span className="text-[15px] font-semibold text-text-primary">
            {t("Penalización", "Penalty")}
          </span>
          <span className="rules-value">
            {t("−50% de puntos", "−50% of points")}
          </span>
        </div>
        <p className="text-[13px] text-text-muted m-0">
          {t(
            `Acierto ajustado: ${CHAMPION_SCORING_RULES.adjustedCorrectPoints} pts (en vez de ${PICK_WINDOW_POINT_VALUES.A}).`,
            `Adjusted hit: ${CHAMPION_SCORING_RULES.adjustedCorrectPoints} pts (instead of ${PICK_WINDOW_POINT_VALUES.A}).`
          )}
        </p>
      </Card>

      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">{t("DEADLINE", "DEADLINE")}</span>
          <p className="m-0 text-text-primary font-semibold">
            {t(
              `Cierra ${PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF} min antes del kickoff.`,
              `Locks ${PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF} min before kickoff.`
            )}
          </p>
        </Card>

        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">{t("CRUCES", "KNOCKOUTS")}</span>
          <p className="m-0 text-text-primary font-semibold">
            {t("Solo cuenta el 90'.", "Only the 90' counts.")}
          </p>
          <p className="m-0 text-text-secondary text-[13px] leading-[1.45]">
            {t(
              "Si se define por penales, tu predicción de empate acierta igual.",
              "If decided on penalties, predicting a draw still hits."
            )}
          </p>
        </Card>

        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">{t("EMPATES EN RANKING", "RANKING TIES")}</span>
          <p className="m-0 text-text-primary font-semibold">
            {t("Gana quien tiene más aciertos exactos.", "Most exact hits wins.")}
          </p>
        </Card>

        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">{t("LIGAS", "LEAGUES")}</span>
          <p className="m-0 text-text-primary font-semibold">
            {t("Competís contra tu gente.", "Compete with your crew.")}
          </p>
          <p className="m-0 text-text-secondary text-[13px] leading-[1.45]">
            {t(
              "Creá ligas privadas y compartí el link. Cada liga tiene su propia tabla.",
              "Create private leagues and share the link. Each league has its own standings."
            )}
          </p>
        </Card>
      </section>

      <Card elevated className="gap-3 p-5">
        <div className="grid gap-1">
          <span className="typo-eyebrow text-primary-500">{t("PLANES", "PLANS")}</span>
          <h2 className="typo-h3 m-0 text-text-primary">
            {t("Standard y Gold", "Standard and Gold")}
          </h2>
        </div>

        <div className="rules-plan-grid">
          <div className="rules-plan-card">
            <div className="flex justify-between items-baseline gap-2">
              <strong className="text-[16px] text-text-primary">Standard</strong>
              <span className="text-[13px] text-text-muted font-semibold">{t("Gratis", "Free")}</span>
            </div>
            <div className="grid gap-1">
              <span className="rules-plan-feature">{t("Hasta 3 ligas", "Up to 3 leagues")}</span>
              <span className="rules-plan-feature">{t("20 jugadores por liga", "20 players per league")}</span>
              <span className="rules-plan-feature">{t("Con anuncios", "With ads")}</span>
            </div>
          </div>
          <div className="rules-plan-card rules-plan-card-gold">
            <div className="flex justify-between items-baseline gap-2">
              <strong className="text-[16px] text-text-primary">Gold</strong>
              <span className="rules-gold-badge">$5</span>
            </div>
            <div className="grid gap-1">
              <span className="rules-plan-feature">{t("Ligas ilimitadas", "Unlimited leagues")}</span>
              <span className="rules-plan-feature">{t("20 jugadores por liga", "20 players per league")}</span>
              <span className="rules-plan-feature">{t("Sin anuncios", "No ads")}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card elevated className="gap-2 p-5">
        <span className="typo-eyebrow">{t("PREMIOS", "PRIZES")}</span>
        <p className="m-0 text-text-secondary text-[14px] leading-[1.5]">
          {t(
            "El premio entre participantes se acuerda y se gestiona entre los propios amigos. Prode Mundial no interviene en la administración del premio.",
            "Any prize among participants is agreed and managed privately between friends. Prode Mundial does not administer or mediate prizes."
          )}
        </p>
      </Card>

      <SupportNav sticky />
    </main>
  );
}
