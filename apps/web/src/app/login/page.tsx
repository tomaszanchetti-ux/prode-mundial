import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card } from "@prode/ui";

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px 56px", display: "grid", gap: 16 }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>Entrar para jugar</h1>
        <p>Epic 1 ya deja lista la pantalla y el copy. La integración real con Firebase será el próximo paso.</p>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            disabled
            style={{ padding: "14px 16px", borderRadius: 999, border: 0, background: "#102a13", color: "#f6f5ef" }}
          >
            Continuar con Google
          </button>
          <input
            type="email"
            disabled
            placeholder="tu@email.com"
            style={{ padding: 12, borderRadius: 12, border: "1px solid #c9cfbf" }}
          />
          <button
            type="button"
            disabled
            style={{ padding: "14px 16px", borderRadius: 999, border: "1px solid #c9cfbf", background: "#fffdf7" }}
          >
            Enviar magic link
          </button>
        </div>
      </Card>

      <Card>
        <p style={{ marginTop: 0 }}>
          Mientras tanto, el shell protegido y el perfil pueden recorrerse con sesión de desarrollo local.
        </p>
        <Link href="/home" style={{ color: "#335c3d", fontWeight: 700 }}>
          Abrir home de desarrollo
        </Link>
      </Card>

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
