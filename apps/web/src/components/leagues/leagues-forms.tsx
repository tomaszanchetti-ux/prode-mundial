import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { LeagueDetail } from "@prode/shared";
import { Button, Card } from "@prode/ui";
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
};

export function CreateLeagueForm({ formState, isSubmitting, onFieldChange, onSubmit }: CreateLeagueFormProps) {
  return (
    <Card elevated style={{ gap: 12 }}>
      <h2 className="typo-h3 m-0 text-text-primary">Crear liga</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="typo-small text-text-secondary">Nombre de la liga</span>
          <input
            name="leagueName"
            value={formState.leagueName}
            onChange={onFieldChange}
            minLength={3}
            maxLength={40}
            placeholder="Liga del Asado"
            required
            className="email-input"
          />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear"}
        </Button>
      </form>
    </Card>
  );
}

export function JoinLeagueForm({ formState, isSubmitting, onFieldChange, onSubmit }: JoinLeagueFormProps) {
  return (
    <Card elevated style={{ gap: 12 }}>
      <h2 className="typo-h3 m-0 text-text-primary">Unirse con código</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="typo-small text-text-secondary">Código</span>
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
          {isSubmitting ? "Uniendome..." : "Unirme"}
        </Button>
      </form>
    </Card>
  );
}

export function ActionResultCard({ actionMessage, league, onOpenLeague }: ActionResultCardProps) {
  return (
    <Card elevated className="league-action-bg" style={{ gap: 12 }}>
      <span className="typo-small text-primary-500">ACCION COMPLETADA</span>
      <h2 className="typo-h3 m-0 text-text-primary">{league.name}</h2>
      <p className="typo-body m-0 text-text-secondary">
        {actionMessage ?? "La liga ya quedo lista para competir."}
      </p>
      <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        <Metric label="Codigo" value={league.inviteCode} />
        <Metric label="Jugadores" value={`${league.membersCount}/${league.memberLimit}`} />
        <Metric label="Tu rol" value={league.membershipRole === "owner" ? "Creador" : "Miembro"} />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onOpenLeague(league.leagueId)}>Abrir liga</Button>
      </div>
      {league.inviteLink ? (
        <div className="grid gap-1.5 p-3 rounded-[16px] surface-inset">
          <div className="flex justify-between gap-2 items-center">
            <span className="typo-small text-text-muted">INVITE LINK</span>
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
      <span className="typo-small text-text-muted">{label}</span>
      <span className="typo-h3 m-0 text-text-primary">{value}</span>
    </div>
  );
}
