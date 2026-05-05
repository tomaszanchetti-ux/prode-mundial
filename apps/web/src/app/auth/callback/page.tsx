import { Suspense } from "react";
import { AuthCallbackScreen } from "@/components/auth/auth-callback-screen";

// El callback dedicado existe para 2 razones:
// 1. UX: el user que clickea el magic link aterriza en una pantalla con UNA sola
//    acción ("Ingresá aquí") en vez de la landing de login con todas las opciones.
// 2. Anti-scanner: `signInWithEmailLink` solo se dispara on-click humano, NO en
//    page-load. Eso evita que los pre-fetchers de Gmail/Outlook consuman el
//    `oobCode` (single-use) antes que el user.
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="landing-bg-dark min-h-[100dvh] grid place-items-center px-6 text-white/72">
          Verificando link...
        </main>
      }
    >
      <AuthCallbackScreen />
    </Suspense>
  );
}
