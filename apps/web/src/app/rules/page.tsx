import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card } from "@prode/ui";

export default function RulesPage() {
  return (
    <main className="max-w-[920px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <Card elevated className="rules-hero-bg gap-3 p-6">
        <span className="typo-small text-primary-500">REGLAS Y PUNTOS</span>
        <h1 className="typo-h2 m-0 text-text-primary">Lo importante para jugar sin dudas</h1>
        <p className="typo-body m-0 text-text-secondary max-w-[680px]">
          Estas son las reglas base del MVP para predecir, sumar puntos y competir dentro de tus ligas.
        </p>
      </Card>

      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-small text-text-muted">DEADLINE</span>
          <p className="m-0 text-text-primary font-semibold">Cada prediccion cierra en el kickoff exacto.</p>
          <p className="m-0 text-text-secondary">No hay tolerancia extra ni cierres manuales despues.</p>
        </Card>

        <Card elevated className="gap-2.5 p-5">
          <span className="typo-small text-text-muted">SCORING</span>
          <p className="m-0 text-text-primary font-semibold">Los puntos se calculan siempre desde backend.</p>
          <p className="m-0 text-text-secondary">El resultado oficial dispara el scoring y actualiza tus estados.</p>
        </Card>

        <Card elevated className="gap-2.5 p-5">
          <span className="typo-small text-text-muted">COMPETENCIA</span>
          <p className="m-0 text-text-primary font-semibold">Toda la competencia visible vive en ligas.</p>
          <p className="m-0 text-text-secondary">No hay ranking global en este MVP.</p>
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
