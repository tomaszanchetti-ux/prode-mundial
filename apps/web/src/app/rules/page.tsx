import Link from "next/link";
import {
  CHAMPION_SCORING_RULES,
  MATCH_SCORING_RULES,
  PICK_WINDOW_POINT_VALUES,
  PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF,
  SUPPORT_LINKS
} from "@prode/shared";
import { Card } from "@prode/ui";

export default function RulesPage() {
  return (
    <main className="max-w-[920px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <Card elevated className="rules-hero-bg gap-3 p-6">
        <span className="typo-eyebrow text-primary-500">REGLAS Y PUNTOS</span>
        <h1 className="typo-h2 m-0 text-text-primary">Así se juega</h1>
        <p className="typo-body m-0 text-text-secondary max-w-[680px]">
          Predecís el marcador de cada partido al 90&apos; y elegís tres picks del Mundial.
          Cada acierto suma. El que más junte, gana.
        </p>
      </Card>

      <Card elevated className="gap-4 p-5">
        <div className="grid gap-1">
          <span className="typo-eyebrow text-primary-500">POR PARTIDO</span>
          <h2 className="typo-h3 m-0 text-text-primary">Puntos por cada partido</h2>
          <p className="typo-body m-0 text-text-secondary">
            Aplica igual en grupos y en cruces eliminatorios. Solo cuenta el resultado al minuto 90.
          </p>
        </div>

        <div className="grid gap-2">
          <div className="rules-points-row rules-points-row-highlight">
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">Marcador exacto</span>
              <span className="text-[13px] text-text-secondary">Acertás ganador y el resultado (ej. 2-1 → 2-1)</span>
            </div>
            <strong>{MATCH_SCORING_RULES.exact90Points} pts</strong>
          </div>
          <div className="rules-points-row">
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">Solo resultado</span>
              <span className="text-[13px] text-text-secondary">Acertás ganador (o empate) pero errás el marcador</span>
            </div>
            <strong>{MATCH_SCORING_RULES.correctOutcome90Points} pts</strong>
          </div>
          <div className="rules-points-row">
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">Error</span>
              <span className="text-[13px] text-text-secondary">No acertás ni ganador ni marcador</span>
            </div>
            <strong>0 pts</strong>
          </div>
        </div>
      </Card>

      <Card elevated className="gap-4 p-5">
        <div className="grid gap-1">
          <span className="typo-eyebrow text-primary-500">POR PICK</span>
          <h2 className="typo-h3 m-0 text-text-primary">Tus 3 picks del Mundial</h2>
          <p className="typo-body m-0 text-text-secondary">
            Elegís <strong>Campeón</strong>, <strong>Sub-Campeón</strong> y{" "}
            <strong>Balón de Oro</strong> antes del torneo. Si tu Campeón o Sub-Campeón quedan
            eliminados en grupos, podés ajustar la apuesta — pero la apuesta ajustada vale menos.
          </p>
        </div>

        <div className="grid gap-2">
          <div className="rules-points-row rules-points-row-highlight">
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">Acierto pre-grupos</span>
              <span className="text-[13px] text-text-secondary">Picks originales (antes del primer partido)</span>
            </div>
            <strong>{PICK_WINDOW_POINT_VALUES.A} pts</strong>
          </div>
          <div className="rules-points-row">
            <div className="grid gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary">Acierto ajustado</span>
              <span className="text-[13px] text-text-secondary">Picks modificados después del cierre de grupos</span>
            </div>
            <strong>{CHAMPION_SCORING_RULES.adjustedCorrectPoints} pts</strong>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">DEADLINE</span>
          <p className="m-0 text-text-primary font-semibold">
            Cierran {PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF} minutos antes del kickoff.
          </p>
          <p className="m-0 text-text-secondary text-[14px] leading-[1.45]">
            No hay tolerancia extra. Si llegás tarde al lock, el partido no te suma.
          </p>
        </Card>

        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">KNOCKOUTS</span>
          <p className="m-0 text-text-primary font-semibold">Solo cuenta el 90&apos;.</p>
          <p className="m-0 text-text-secondary text-[14px] leading-[1.45]">
            Si el partido termina en empate y se define por penales, tu predicción de empate
            acierta igual.
          </p>
        </Card>

        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">LIGAS</span>
          <p className="m-0 text-text-primary font-semibold">
            Competís contra tu gente, no contra el mundo.
          </p>
          <p className="m-0 text-text-secondary text-[14px] leading-[1.45]">
            Creá ligas privadas y compartí el link. Cada liga tiene su propia tabla.
          </p>
        </Card>

        <Card elevated className="gap-2 p-5">
          <span className="typo-eyebrow">SCORING</span>
          <p className="m-0 text-text-primary font-semibold">
            Los puntos se calculan desde backend.
          </p>
          <p className="m-0 text-text-secondary text-[14px] leading-[1.45]">
            El resultado oficial dispara el scoring y actualiza tus ligas automáticamente.
          </p>
        </Card>
      </section>

      <Card className="gap-3 p-4">
        <div className="flex flex-wrap gap-3">
          {SUPPORT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-text-secondary font-semibold no-underline">
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}
