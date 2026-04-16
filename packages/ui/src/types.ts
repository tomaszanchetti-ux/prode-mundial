import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  ReactNode
} from "react";

// ── Primitives ────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type StatusTone = "editable" | "locked" | "live" | "scored";
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
  ctaLabel: string;
  eyebrow: string;
  helperText?: string;
  homeTeam: TeamData;
  metaLabel: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryCtaLabel?: string;
  status: MatchCardStatus;
  statusLabel: string;
  title: string;
};

export type ProgressCompactProps = {
  items: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
};

export type AdSlotCardProps = {
  title?: string;
  description: string;
};

export type MatchCardProps = {
  awayTeam: TeamData;
  ctaLabel: string;
  groupId?: string | null;
  homeTeam: TeamData;
  kickoffLabel: string;
  onAction?: () => void;
  predictionSummary?: string;
  resultSummary?: string;
  stage?: string;
  stageLabel: string;
  status: MatchCardStatus;
  statusLabel?: string;
};

export type ScoreInputProps = {
  awayLabel?: string;
  awayValue: string;
  classifierLabel?: string;
  classifierOptions?: Array<{ label: string; value: string }>;
  classifierValue?: string;
  disabled?: boolean;
  error?: string;
  homeLabel?: string;
  homeValue: string;
  onAwayChange?: (value: string) => void;
  onClassifierChange?: (value: string) => void;
  onHomeChange?: (value: string) => void;
};

export type PredictionModalProps = {
  awayTeam: TeamData;
  children?: ReactNode;
  helperText?: string;
  homeTeam: TeamData;
  isOpen: boolean;
  kickoffLabel: string;
  onClose?: () => void;
  onSubmit?: () => void;
  saveLabel?: string;
  saving?: boolean;
  stageLabel: string;
  title?: string;
};
