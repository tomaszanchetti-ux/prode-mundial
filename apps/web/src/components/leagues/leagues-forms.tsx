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
    <Card elevated style={{ gap: 16 }}>
      <div className="grid gap-1.5">
        <span className="typo-small text-primary-500">CREAR LIGA</span>
        <h2 className="typo-h3 m-0 text-text-primary">Abre tu mesa competitiva</h2>
        <p className="typo-body m-0 text-text-secondary">
          El nombre sale publicado para todos los miembros. Apenas la creas te devolvemos codigo e invite link.
        </p>
      </div>
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
          {isSubmitting ? "Creando..." : "Crear liga"}
        </Button>
      </form>
    </Card>
  );
}

export function JoinLeagueForm({ formState, isSubmitting, onFieldChange, onSubmit }: JoinLeagueFormProps) {
  return (
    <Card elevated style={{ gap: 16 }}>
      <div className="grid gap-1.5">
        <span className="typo-small text-gold">JOIN POR CODIGO</span>
        <h2 className="typo-h3 m-0 text-text-primary">Entra a una liga existente</h2>
        <p className="typo-body m-0 text-text-secondary">
          Pega el codigo que te compartieron. Lo normalizamos y validamos antes de sumarte.
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="typo-small text-text-secondary">Codigo de invitacion</span>
          <input
            name="inviteCode"
            value={formState.inviteCode}
            onChange={onFieldChange}
            minLength={4}
            maxLength={24}
            placeholder="ASADO26"
            required
            className="email-input uppercase"
          />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Uniendome..." : "Unirme a la liga"}
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
            <CopyButton value={league.inviteLink} />
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
