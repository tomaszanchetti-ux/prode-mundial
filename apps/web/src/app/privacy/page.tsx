import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card } from "@prode/ui";

export default function PrivacyPage() {
  return (
    <main className="max-w-[920px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <Card elevated className="gap-3 p-6">
        <span className="typo-small text-text-muted">PRIVACIDAD</span>
        <h1 className="typo-h2 m-0 text-text-primary">Como se usan tus datos dentro del Prode</h1>
        <p className="typo-body m-0 text-text-secondary max-w-[680px]">
          Esta base resume el uso de tu informacion de cuenta y de juego mientras se completa la version formal de privacidad.
        </p>
      </Card>

      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-small text-text-muted">CUENTA</span>
          <p className="m-0 text-text-primary font-semibold">Usamos tu email, nombre visible y datos basicos de autenticacion para operar tu acceso.</p>
        </Card>
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-small text-text-muted">JUEGO</span>
          <p className="m-0 text-text-primary font-semibold">Tus predicciones, puntos y posiciones se guardan para sostener la experiencia competitiva.</p>
        </Card>
        <Card elevated className="gap-2.5 p-5">
          <span className="typo-small text-text-muted">CONTROL</span>
          <p className="m-0 text-text-primary font-semibold">Siempre mantienes acceso a tu perfil y al estado visible de tu cuenta dentro del producto.</p>
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
