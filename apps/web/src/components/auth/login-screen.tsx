"use client";

import React from "react";
import { useEffect } from "react";
import Link from "next/link";
import { APP_ROUTES, SUPPORT_LINKS } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";
import { LoginBlock } from "./login-block";

export function resolveNextRoute(next: string | null, profileCompleted: boolean | undefined) {
  if (profileCompleted === false) {
    return APP_ROUTES.profile;
  }

  return next && next.startsWith("/") ? next : APP_ROUTES.home;
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(searchParams.get("next"), profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, searchParams, status]);

  return (
    <main className="landing-bg-dark min-h-[100dvh] grid grid-rows-[1fr_auto] px-6">
      <div className="flex flex-col items-center justify-center gap-10 py-10 max-w-[420px] mx-auto w-full">
        <div className="grid gap-3 text-center">
          <h1 className="landing-title">Volvé a tu Mundial.</h1>
          <p className="landing-subtitle">Entrá para seguir jugando.</p>
        </div>

        <LoginBlock />
      </div>

      <footer className="flex flex-wrap gap-4 justify-center py-6">
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="landing-footer-link">
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}
