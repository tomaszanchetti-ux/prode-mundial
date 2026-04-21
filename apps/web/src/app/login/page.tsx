import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/login-screen";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-[1080px] mx-auto px-4 pt-6 pb-14 text-text-secondary">
          Cargando acceso...
        </main>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
