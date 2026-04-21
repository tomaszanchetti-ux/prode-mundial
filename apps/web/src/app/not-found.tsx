import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="grid gap-5 max-w-[420px] text-center">
        <div className="grid gap-2">
          <span className="typo-small text-primary-500">404</span>
          <h1 className="typo-h2 m-0 text-text-primary">
            Esta ruta no existe
          </h1>
          <p className="typo-body m-0 text-text-secondary">
            Capaz que el link está viejo. Desde el inicio llegás a todo —
            partidos, Mi Mundial y tus ligas.
          </p>
        </div>

        <Link
          href="/"
          className="h-11 px-4 rounded-lg bg-primary-500 text-white font-semibold no-underline inline-flex items-center justify-center active:scale-[0.98] transition"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
