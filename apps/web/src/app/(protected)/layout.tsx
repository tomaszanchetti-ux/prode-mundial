"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { FcmSync } from "@/components/notifications/fcm-sync";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

function resolveInitials(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProtectedHeader() {
  const { locale } = useLocale();
  const { profile, user } = useAuth();
  const initials =
    resolveInitials(profile?.displayName) ?? resolveInitials(user?.displayName ?? null);
  const fallback = copyForLocale(locale, "Mi", "Me");
  const profileLabel = copyForLocale(locale, "Abrir perfil", "Open profile");

  return (
    <header className="flex items-center justify-end gap-3 pt-[2px]">
      <LanguageToggle />
      <Link
        href="/profile"
        aria-label={profileLabel}
        title={profileLabel}
        className="w-11 h-11 rounded-pill grid place-items-center no-underline text-text-primary text-[13px] font-bold tracking-[0.06em] uppercase bg-bg-interactive border border-border-default hover:bg-[#E3E7EC] transition-colors"
      >
        {initials ?? fallback}
      </Link>
    </header>
  );
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <main className="max-w-[1120px] mx-auto px-4 pt-3 pb-8 grid gap-4">
        <ProtectedHeader />
        <section>{children}</section>
        <BottomNav />
      </main>
      <FcmSync />
    </AuthGuard>
  );
}
