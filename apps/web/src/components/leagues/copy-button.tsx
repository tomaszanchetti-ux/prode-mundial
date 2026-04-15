"use client";

import React, { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
};

export function CopyButton({ value, label = "Copiar", copiedLabel = "Copiado" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop — clipboard puede no estar disponible (sin HTTPS, permisos, etc.)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`copy-btn${copied ? " copy-btn-copied" : ""}`}
      aria-label={`${label} ${value}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
