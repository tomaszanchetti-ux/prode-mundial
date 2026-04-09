"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { APP_ROUTES } from "@prode/shared";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`${APP_ROUTES.login}${next}`);
      return;
    }

    if (status !== "authenticated" || !profile) {
      return;
    }

    if (!profile.profileCompleted && pathname !== APP_ROUTES.profile) {
      router.replace(APP_ROUTES.profile);
    }
  }, [pathname, profile, router, status]);

  if (status === "loading" || status === "idle") {
    return <p style={{ margin: 0, color: "#5f6657" }}>Cargando sesión...</p>;
  }

  if (status === "error") {
    return <p style={{ margin: 0, color: "#8a1c1c" }}>No pudimos validar tu sesión.</p>;
  }

  if (status !== "authenticated") {
    return <p style={{ margin: 0, color: "#5f6657" }}>Redirigiendo a login...</p>;
  }

  return <>{children}</>;
}
