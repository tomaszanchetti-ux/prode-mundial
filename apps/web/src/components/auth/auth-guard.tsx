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
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "grid",
          alignContent: "center",
          gap: 12,
          justifyItems: "start"
        }}
      >
        <div style={{ width: 112, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
        <div style={{ width: 220, height: 14, borderRadius: 999, background: "rgba(255, 255, 255, 0.05)" }} />
      </div>
    );
  }

  if (status === "error") {
    return <p style={{ margin: 0, color: "#F5B4B4" }}>No pudimos validar tu sesion.</p>;
  }

  if (status !== "authenticated") {
    return <p style={{ margin: 0, color: "#92A3BA" }}>Volviendo al ingreso...</p>;
  }

  return <>{children}</>;
}
