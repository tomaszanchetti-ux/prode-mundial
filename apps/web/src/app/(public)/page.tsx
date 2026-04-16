import { Suspense } from "react";
import { LandingMinimal } from "@/components/auth/landing-minimal";

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center px-6 text-text-secondary">
          Cargando...
        </main>
      }
    >
      <LandingMinimal />
    </Suspense>
  );
}
