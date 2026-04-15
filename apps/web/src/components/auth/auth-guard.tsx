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
      <div className="min-h-[40vh] grid content-center gap-3 justify-items-start">
        <div className="w-28 h-2.5 rounded-full bg-border-strong" />
        <div className="w-[220px] h-3.5 rounded-full bg-border-subtle" />
      </div>
    );
  }

  if (status === "error") {
    return <p className="m-0 text-error">No pudimos validar tu sesion.</p>;
  }

  if (status !== "authenticated") {
    return <p className="m-0 text-text-secondary">Volviendo al ingreso...</p>;
  }

  return <>{children}</>;
}
