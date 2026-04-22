"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES } from "@prode/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type SupportNavVariant = "public" | "card";

type SupportNavProps = {
  variant?: SupportNavVariant;
  sticky?: boolean;
};

type SupportItem = {
  key: "home" | "rules" | "legal";
  label: string;
  href: string;
};

function useSupportItems(): SupportItem[] {
  const { status } = useAuth();
  const { locale } = useLocale();

  const homeHref = status === "authenticated" ? APP_ROUTES.home : "/";

  return [
    { key: "home", label: copyForLocale(locale, "Inicio", "Home"), href: homeHref },
    { key: "rules", label: copyForLocale(locale, "Reglas", "Rules"), href: "/rules" },
    { key: "legal", label: copyForLocale(locale, "Términos y Privacidad", "Terms & Privacy"), href: "/legal" }
  ];
}

export function SupportNav({ variant = "public", sticky = false }: SupportNavProps) {
  const items = useSupportItems();
  const pathname = usePathname();

  const isActive = (item: SupportItem) =>
    item.key === "home"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (variant === "card") {
    return (
      <nav aria-label="Navegación" className="grid gap-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="support-nav-card-row"
            data-active={isActive(item)}
          >
            <span>{item.label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>
    );
  }

  const nav = (
    <nav aria-label="Navegación" className="support-nav-public">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="support-nav-link"
          data-active={isActive(item)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  if (sticky) {
    return <div className="support-nav-sticky">{nav}</div>;
  }

  return nav;
}
