import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  ReactNode
} from "react";

// ── Primitives ────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
// Sistema semántico estricto (WS50 / Fase 2 ronda 2):
//   editable      → acción disponible (azul)
//   saved         → predicción guardada (verde)
//   closing-soon  → empty + editable con deadline ≤ 2h (amarillo, urgencia)
//   live          → partido en curso (rojo)
//   scored        → partido ya puntuado (verde, se diferencia por label tipo "+12 pts")
//   neutral       → cualquier estado no accionable (gris): opens-later, locked sin predecir, etc.
export type StatusTone =
  | "editable"
  | "saved"
  | "closing-soon"
  | "live"
  | "scored"
  | "neutral";
export type MatchCardStatus = StatusTone;

// ── Component Props ───────────────────────────────────

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    loading?: boolean;
    fullWidth?: boolean;
  }
>;

export type CardProps<T extends ElementType = "div"> = PropsWithChildren<
  ComponentPropsWithoutRef<T> & {
    as?: T;
    elevated?: boolean;
  }
>;

export type StatusTagProps = {
  status: StatusTone;
  label?: string;
};

// ── Team ─────────────────────────────────────────────

export type TeamData = {
  fifaCode?: string | null;
  flagUrl?: string | null;
  flagAsset?: string | null;
  iso2?: string | null;
  iso3?: string | null;
  name?: string;
  teamName?: string;
};

export type TeamIdentitySize = "sm" | "md" | "lg";
export type TeamIdentityEmphasis = "compact" | "default" | "hero";

export type TeamIdentityProps = {
  team: TeamData;
  size?: TeamIdentitySize;
  showFlag?: boolean;
  showName?: boolean;
  showCode?: boolean;
  emphasis?: TeamIdentityEmphasis;
  align?: "start" | "center";
};

// ── Legacy aliases (backward compat) ────────────────

export type TeamFlagProps = {
  fifaCode?: string | null;
  flagUrl?: string | null;
  flagAsset?: string | null;
  iso2?: string | null;
  iso3?: string | null;
  name?: string;
  teamName?: string;
  size?: TeamIdentitySize;
};

export type TeamIdentityRowProps = TeamFlagProps & {
  align?: "start" | "center";
  code?: string | null;
  weight?: 500 | 600 | 700;
};

export type TeamDisplayProps = TeamFlagProps & {
  align?: "start" | "center";
  code?: string | null;
  size?: TeamIdentitySize;
  weight?: 500 | 600 | 700;
};

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "start" | "center";
};

export type NextMatchHeroProps = {
  awayTeam: TeamData;
  disabled?: boolean;
  eyebrow: string;
  helperText?: string;
  homeTeam: TeamData;
  metaLabel?: string;
  onAction?: () => void;
  score?: { home: string; away: string } | null;
  status: MatchCardStatus;
  statusLabel: string;
  title: string;
};

export type StatTone = "neutral" | "success" | "primary" | "warning";

export type ProgressCompactProps = {
  items: Array<{
    label: string;
    value: string;
    hint?: string;
    tone?: StatTone;
  }>;
};

export type AdSlotCardProps = {
  title?: string;
  description?: string;
};

export type MatchCardProps = {
  awayTeam: TeamData;
  ctaLabel: string;
  groupId?: string | null;
  homeTeam: TeamData;
  kickoffLabel: string;
  onAction?: () => void;
  predictionSummary?: string | null;
  stage?: string;
  stageLabel: string;
  status: MatchCardStatus;
  statusLabel?: string;
};

export type ScoreInputProps = {
  awayLabel?: string;
  awayTeam?: TeamData;
  awayValue: string;
  disabled?: boolean;
  error?: string;
  homeLabel?: string;
  homeTeam?: TeamData;
  homeValue: string;
  justSaved?: boolean;
  onAwayChange?: (value: string) => void;
  onHomeChange?: (value: string) => void;
};

export type PredictionModalProps = {
  awayTeam: TeamData;
  children?: ReactNode;
  closeLabel?: string;
  helperText?: string;
  homeTeam: TeamData;
  isOpen: boolean;
  kickoffLabel: string;
  onClose?: () => void;
  onSubmit?: () => void;
  progressCurrent?: number;
  progressTotal?: number;
  saveLabel?: string;
  saving?: boolean;
  stageLabel: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  title?: string;
};
