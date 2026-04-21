"use client";

import React, { useState } from "react";
import { Button } from "@prode/ui";
import { track } from "@/lib/firebase/analytics";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  shareLeagueId?: string;
};

export function CopyButton({ value, label = "Copiar", copiedLabel = "Copiado", shareLeagueId }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (shareLeagueId) {
        track("invite_shared", { leagueId: shareLeagueId, shareMethod: "copy_link" });
      }
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop — clipboard puede no estar disponible (sin HTTPS, permisos, etc.)
    }
  }

  return (
    <Button variant="primary" onClick={handleCopy} aria-label={`${label} ${value}`}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
