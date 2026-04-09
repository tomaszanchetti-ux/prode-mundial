"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { APP_ROUTES } from "@prode/shared";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function resolveAuthGuardRedirect(status: string, pathname: string | null, profileCompleted?: boolean) {
  if (status === "unauthenticated") {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    return `${APP_ROUTES.login}${next}`;
  }

  if (status === "authenticated" && profileCompleted === false && pathname !== APP_ROUTES.profile) {
    return APP_ROUTES.profile;
  }

  return null;
}

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, status } = useAuth();

  useEffect(() => {
    const redirectTarget = resolveAuthGuardRedirect(status, pathname, profile?.profileCompleted);

    if (!redirectTarget || (status === "authenticated" && !profile)) {
      return;
    }

    router.replace(redirectTarget);
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
