"use client";

import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { LeagueDetail } from "@prode/shared";
import { Button, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { CopyButton } from "./copy-button";

type CreateLeagueFormProps = {
  formState: { leagueName: string };
  isSubmitting: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type JoinLeagueFormProps = {
  formState: { inviteCode: string };
  isSubmitting: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type ActionResultCardProps = {
  actionMessage: string | null;
  league: LeagueDetail;
  onOpenLeague: (leagueId: string) => void;
  onDismiss?: () => void;
};

export function CreateLeagueForm({ formState, isSubmitting, onFieldChange, onSubmit }: CreateLeagueFormProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  return (
    <Card elevated style={{ gap: 12 }}>
      <h2 className="typo-h3 m-0 text-text-primary">{t("Crear liga", "Create league")}</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="typo-small text-text-secondary">{t("Nombre de la liga", "League name")}</span>
          <input
            name="leagueName"
            value={formState.leagueName}
            onChange={onFieldChange}
            minLength={3}
            maxLength={40}
            placeholder={t("Liga del Asado", "Sunday League")}
            required
            className="email-input"
          />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("Creando...", "Creating...") : t("Crear", "Create")}
        </Button>
      </form>
    </Card>
  );
}

export function JoinLeagueForm({ formState, isSubmitting, onFieldChange, onSubmit }: JoinLeagueFormProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  return (
    <Card elevated style={{ gap: 12 }}>
      <h2 className="typo-h3 m-0 text-text-primary">{t("Unirse con código", "Join with code")}</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="typo-small text-text-secondary">{t("Código", "Code")}</span>
          <input
            name="inviteCode"
            value={formState.inviteCode}
            onChange={onFieldChange}
            minLength={4}
            maxLength={24}
            placeholder="ABC123"
            required
            className="email-input uppercase"
          />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("Uniéndome...", "Joining...") : t("Unirme", "Join")}
        </Button>
      </form>
    </Card>
  );
}

export function ActionResultCard({ actionMessage, league, onOpenLeague, onDismiss }: ActionResultCardProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  return (
    <Card elevated className="league-action-bg" style={{ gap: 12, position: "relative" }}>
      {onDismiss ? (
        <button
          type="button"
          aria-label={t("Cerrar", "Close")}
          onClick={onDismiss}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-inset transition-colors"
        >
          <span aria-hidden="true" className="text-[18px] leading-none font-light">×</span>
        </button>
      ) : null}
      <h2 className="typo-h3 m-0 text-text-primary pr-8">{league.name}</h2>
      {actionMessage ? (
        <p className="typo-body m-0 text-text-secondary">{actionMessage}</p>
      ) : null}
      <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        <Metric label={t("Código", "Code")} value={league.inviteCode} />
        <Metric label={t("Jugadores", "Players")} value={`${league.membersCount}/${league.memberLimit}`} />
        <Metric
          label={t("Tu rol", "Your role")}
          value={league.membershipRole === "owner" ? t("Creador", "Owner") : t("Miembro", "Member")}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onOpenLeague(league.leagueId)}>{t("Abrir liga", "Open league")}</Button>
      </div>
      {league.inviteLink ? (
        <div className="grid gap-1.5 p-3 rounded-[16px] surface-inset">
          <div className="flex justify-between gap-2 items-center">
            <span className="typo-small text-text-muted">{t("Link", "Link")}</span>
            <CopyButton value={league.inviteLink} shareLeagueId={league.leagueId} />
          </div>
          <span className="text-[14px] leading-[1.4] text-text-secondary break-all">{league.inviteLink}</span>
        </div>
      ) : null}
    </Card>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 p-3 surface-inset">
      <span className="typo-meta">{label}</span>
      <span className="typo-h3 m-0 text-text-primary">{value}</span>
    </div>
  );
}
