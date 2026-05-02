"use client";

import React, { useState } from "react";
import { Button } from "@prode/ui";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type ShareInviteButtonProps = {
  leagueName: string;
  inviteCode: string;
  inviteLink: string;
  shareLeagueId: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function ShareInviteButton({
  leagueName,
  inviteCode,
  inviteLink,
  shareLeagueId,
  variant = "ghost"
}: ShareInviteButtonProps) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const label = copyForLocale(locale, "Invitar", "Invite");
  const copiedLabel = copyForLocale(locale, "Copiado", "Copied");

  const message = copyForLocale(
    locale,
    `Te invito a "${leagueName}" en Prode Mundial 🏆\n\nEntrá directo: ${inviteLink}\n\nO usá el código: ${inviteCode}`,
    `Join my league "${leagueName}" on Prode Mundial 🏆\n\nOpen the link: ${inviteLink}\n\nOr use the code: ${inviteCode}`
  );

  const shareTitle = copyForLocale(
    locale,
    `Liga ${leagueName} · Prode Mundial`,
    `${leagueName} · Prode Mundial`
  );

  async function handleShare() {
    const canShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (canShare) {
      try {
        await navigator.share({ title: shareTitle, text: message });
        track("invite_shared", {
          leagueId: shareLeagueId,
          shareMethod: "native_share"
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      track("invite_shared", {
        leagueId: shareLeagueId,
        shareMethod: "copy_link"
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard puede no estar disponible (sin HTTPS, permisos, etc.)
    }
  }

  return (
    <Button variant={variant} onClick={handleShare} aria-label={`${label} ${leagueName}`}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
