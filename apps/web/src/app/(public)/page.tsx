import Link from "next/link";
import { DEFAULT_PUBLIC_BOOTSTRAP, SUPPORT_LINKS } from "@prode/shared";
import { Card } from "@prode/ui";
import { getPublicBootstrap } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const bootstrap = await getPublicBootstrap().catch((error) => {
    const isDynamicServerUsage =
      error && typeof error === "object" && "digest" in error && error.digest === "DYNAMIC_SERVER_USAGE";

    if (!isDynamicServerUsage) {
      console.error("Falling back to default public bootstrap.", error);
    }

    return DEFAULT_PUBLIC_BOOTSTRAP;
  });

  return (
    <main className="max-w-[1120px] mx-auto px-4 pt-6 pb-14 grid gap-[18px]">
      <header className="flex items-center justify-between gap-3 py-1.5 px-0.5">
        <div className="grid gap-1">
          <strong className="text-[20px] leading-none text-text-primary tracking-[-0.02em]">Prode Mundial</strong>
          <span className="typo-small text-text-muted">Predice rapido. Compite mejor.</span>
        </div>
        <Link href="/login" className="landing-pill-link">
          Entrar
        </Link>
      </header>

      <section className="landing-hero-bg grid gap-4 p-6 rounded-[28px]">
        <div className="grid gap-3">
          <span className="typo-small text-primary-500">MUNDIAL 2026</span>
          <h1 className="m-0 leading-[0.92] tracking-[-0.05em] text-text-primary max-w-[760px] text-[clamp(3rem,9vw,5.8rem)]">
            {bootstrap.productName}
          </h1>
          <p className="m-0 max-w-[620px] text-[20px] leading-[1.45] text-text-secondary">{bootstrap.tagline}</p>
        </div>

        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.04)] border border-border-default">
            <span className="typo-small text-text-muted">LOOP</span>
            <p className="mt-2 mb-0 text-[18px] leading-[1.3] text-text-primary font-semibold">
              Entra, predice tu proximo partido y vuelve por puntos.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.04)] border border-border-default">
            <span className="typo-small text-text-muted">COMPETENCIA</span>
            <p className="mt-2 mb-0 text-[18px] leading-[1.3] text-text-primary font-semibold">
              Todo gira alrededor de tus ligas, no de un ranking global.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/login" className="landing-cta-primary">
            Jugar ahora
          </Link>
          <Link href="/login" className="landing-cta-secondary">
            Unirme a una liga
          </Link>
        </div>

        <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          {bootstrap.features.map((feature) => (
            <div
              key={feature}
              className="p-4 rounded-lg bg-[rgba(255,255,255,0.03)] border border-border-default text-text-primary text-[15px] leading-[1.35] font-semibold"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Card elevated style={{ gap: 10 }}>
          <span className="typo-small text-text-muted">COMO SE JUEGA</span>
          <p className="m-0 text-[18px] leading-[1.35] text-text-primary font-semibold">Predice en segundos</p>
          <p className="m-0 text-text-secondary">Eliges marcador, guardas y sigues. Sin pantallas pesadas ni vueltas raras.</p>
        </Card>

        <Card elevated style={{ gap: 10 }}>
          <span className="typo-small text-text-muted">COMO SUMAS</span>
          <p className="m-0 text-[18px] leading-[1.35] text-text-primary font-semibold">Puntos claros post partido</p>
          <p className="m-0 text-text-secondary">El backend resuelve estados, resultados y scoring para que siempre veas lo importante.</p>
        </Card>

        <Card elevated style={{ gap: 10 }}>
          <span className="typo-small text-text-muted">COMO COMPITES</span>
          <p className="m-0 text-[18px] leading-[1.35] text-text-primary font-semibold">Tus ligas son el centro</p>
          <p className="m-0 text-text-secondary">Invitas gente, sigues posiciones y vuelves cada dia con una razon concreta para jugar.</p>
        </Card>
      </section>

      <footer className="flex flex-wrap gap-3 py-1 px-0.5">
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-text-secondary font-semibold no-underline">
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}
