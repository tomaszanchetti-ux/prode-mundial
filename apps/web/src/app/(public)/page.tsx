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
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 56px", display: "grid", gap: 20 }}>
      <section
        style={{
          display: "grid",
          gap: 18,
          padding: 28,
          borderRadius: 28,
          background: "linear-gradient(135deg, #102a13 0%, #1d4d2c 100%)",
          color: "#f6f5ef",
          boxShadow: "0 24px 64px rgba(16, 42, 19, 0.18)"
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}>
            Mobile-first. League-first.
          </span>
          <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 7vw, 4.5rem)", lineHeight: 0.95 }}>
            {bootstrap.productName}
          </h1>
          <p style={{ margin: 0, maxWidth: 620, fontSize: 20, lineHeight: 1.4 }}>{bootstrap.tagline}</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/login"
            style={{
              padding: "14px 20px",
              borderRadius: 999,
              background: "#ffd166",
              color: "#102a13",
              textDecoration: "none",
              fontWeight: 700
            }}
          >
            Jugar ahora
          </Link>
          <Link
            href="/login"
            style={{
              padding: "14px 20px",
              borderRadius: 999,
              border: "1px solid rgba(246, 245, 239, 0.4)",
              color: "#f6f5ef",
              textDecoration: "none",
              fontWeight: 700
            }}
          >
            Unirme a una liga
          </Link>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {bootstrap.features.map((feature) => (
            <div
              key={feature}
              style={{
                padding: 16,
                borderRadius: 18,
                background: "rgba(246, 245, 239, 0.08)",
                border: "1px solid rgba(246, 245, 239, 0.1)"
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card>
          <h2 style={{ marginTop: 0 }}>Cómo funciona</h2>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
            <li>Predice partidos en segundos.</li>
            <li>Suma puntos cada día.</li>
            <li>Compite dentro de tus ligas privadas.</li>
          </ol>
        </Card>

        <Card>
          <h2 style={{ marginTop: 0 }}>Auth del MVP</h2>
          <p style={{ marginBottom: 8 }}>Métodos previstos por producto:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Google: {bootstrap.authProviders.google ? "habilitado en contrato" : "apagado"}</li>
            <li>Magic link: {bootstrap.authProviders.magicLink ? "habilitado en contrato" : "apagado"}</li>
          </ul>
        </Card>

        <Card>
          <h2 style={{ marginTop: 0 }}>Reglas rápidas</h2>
          <p style={{ margin: 0 }}>
            Competencia por ligas, deadlines al kickoff exacto y backend como source of truth para puntos y estados.
          </p>
        </Card>
      </section>

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: "#335c3d", fontWeight: 600 }}>
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}
