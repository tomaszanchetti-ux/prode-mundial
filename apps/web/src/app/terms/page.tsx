import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card } from "@prode/ui";

export default function TermsPage() {
  return (
    <main className="max-w-[920px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <Card elevated className="gap-3 p-6">
        <span className="typo-eyebrow">TERMINOS</span>
        <h1 className="typo-h2 m-0 text-text-primary">Condiciones generales del juego</h1>
        <p className="typo-body m-0 text-text-secondary max-w-[680px]">
          Esta pantalla deja listo un marco claro para el acceso y uso del producto mientras se completa la version legal definitiva.
        </p>
      </Card>

      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-eyebrow">USO</span>
          <p className="m-0 text-text-primary font-semibold">La cuenta es personal y se usa para jugar dentro de ligas.</p>
        </Card>
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-eyebrow">DATOS</span>
          <p className="m-0 text-text-primary font-semibold">Las predicciones, puntos y estados se guardan como parte del historial de juego.</p>
        </Card>
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-eyebrow">OPERACION</span>
          <p className="m-0 text-text-primary font-semibold">El producto puede evolucionar, pero siempre respetando las reglas visibles del MVP.</p>
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
