import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/login-screen";

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px 56px" }}>Cargando login...</main>}>
      <LoginScreen />
    </Suspense>
  );
}
