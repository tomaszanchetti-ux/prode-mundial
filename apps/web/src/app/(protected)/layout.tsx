"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

function ProtectedHeader() {
  const { locale } = useLocale();

  return (
    <header className="flex items-center justify-between gap-3 pt-[2px]">
      <div className="grid gap-[2px]">
        <span className="typo-small text-text-muted">PRODE MUNDIAL</span>
        <strong className="text-[18px] leading-none text-text-primary tracking-[-0.02em]">
          {copyForLocale(locale, "Juega tu torneo", "Play your tournament")}
        </strong>
      </div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <Link
          href="/profile"
          className="w-9 h-9 rounded-pill grid place-items-center no-underline text-text-primary text-[12px] font-bold tracking-[0.06em] uppercase bg-bg-interactive border border-border-default hover:bg-[#E3E7EC] transition-colors"
        >
          {copyForLocale(locale, "Mi", "Me")}
        </Link>
      </div>
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
    </AuthGuard>
  );
}
