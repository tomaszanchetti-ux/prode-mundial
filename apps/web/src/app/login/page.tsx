import { Suspense } from "react";
import { colors } from "@prode/ui";
import { LoginScreen } from "@/components/auth/login-screen";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 56px", color: colors.textSecondary }}>
          Cargando acceso...
        </main>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
