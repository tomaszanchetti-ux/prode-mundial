import React from "react";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  ReactNode
} from "react";

// ── Types ──────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost";
type StatusTone = "editable" | "locked" | "live" | "scored";

export type MatchCardStatus = StatusTone;

export type NextMatchHeroProps = {
  awayTeam: TeamDisplayProps;
  ctaLabel: string;
  eyebrow: string;
  helperText?: string;
  homeTeam: TeamDisplayProps;
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

export type TeamFlagProps = {
  fifaCode?: string | null;
  flagUrl?: string | null;
  flagAsset?: string | null;
  iso2?: string | null;
  iso3?: string | null;
  name?: string;
  teamName?: string;
  size?: "sm" | "md" | "lg";
};

export type TeamIdentityRowProps = TeamFlagProps & {
  align?: "start" | "center";
  code?: string | null;
  weight?: 500 | 600 | 700;
};

export type TeamDisplayProps = {
  fifaCode?: string | null;
  flagUrl?: string | null;
  flagAsset?: string | null;
  iso2?: string | null;
  iso3?: string | null;
  name?: string;
  teamName?: string;
  align?: "start" | "center";
  size?: "sm" | "md" | "lg";
  weight?: 500 | 600 | 700;
};

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

export type MatchCardProps = {
  awayTeam: TeamDisplayProps;
  ctaLabel: string;
  homeTeam: TeamDisplayProps;
  kickoffLabel: string;
  onAction?: () => void;
  predictionSummary?: string;
  resultSummary?: string;
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
  awayTeam: TeamDisplayProps;
  children?: ReactNode;
  helperText?: string;
  homeTeam: TeamDisplayProps;
  isOpen: boolean;
  kickoffLabel: string;
  onClose?: () => void;
  onSubmit?: () => void;
  saveLabel?: string;
  saving?: boolean;
  stageLabel: string;
  title?: string;
};

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "start" | "center";
};

// ── Size class maps ────────────────────────────────────

const flagSizeClasses = {
  sm: "w-[22px] h-[22px]",
  md: "w-7 h-7",
  lg: "w-[34px] h-[34px]"
} as const;

const flagSizes = { sm: 22, md: 28, lg: 34 } as const;

const teamTextClasses = {
  sm: "text-[14px]",
  md: "text-[16px]",
  lg: "text-[18px]"
} as const;

const codeTextClasses = {
  sm: "text-[10px]",
  md: "text-[10px]",
  lg: "text-[11px]"
} as const;

const weightClasses: Record<500 | 600 | 700, string> = {
  500: "font-medium",
  600: "font-semibold",
  700: "font-bold"
};

// ── Helpers ────────────────────────────────────────────

const missingFlagWarnings = new Set<string>();

function resolveTeamName(team: Pick<TeamDisplayProps, "name" | "teamName">) {
  return team.teamName ?? team.name ?? "Seleccion";
}

function resolveTeamFlagSrc(team: Pick<TeamDisplayProps, "flagAsset" | "flagUrl">) {
  return team.flagAsset ?? team.flagUrl ?? null;
}

function warnMissingFlag(teamName: string, fifaCode?: string | null) {
  const runtime = globalThis as { process?: { env?: { NODE_ENV?: string } } };
  if (runtime.process?.env?.NODE_ENV === "production") return;
  const key = `${fifaCode ?? "unknown"}:${teamName}`;
  if (missingFlagWarnings.has(key)) return;
  missingFlagWarnings.add(key);
  console.warn(`[ui] Missing flag asset for ${teamName}${fifaCode ? ` (${fifaCode})` : ""}.`);
}

function getFlagFallback(teamName: string) {
  return teamName.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function normalizeScoreValue(value: string) {
  if (value === "") return "";
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return "";
  return String(parsed);
}

function stepScoreValue(value: string, delta: number) {
  const current = value === "" ? 0 : Number.parseInt(value, 10);
  return String(Math.max(0, current + delta));
}

// ── Internal render helpers ────────────────────────────

function renderScoreInput(
  label: string,
  value: string,
  disabled: boolean | undefined,
  onChange: ((value: string) => void) | undefined
) {
  const safeValue = normalizeScoreValue(value);
  const disabledCls = disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer";

  return (
    <div className="w-full min-h-[144px] rounded-lg border border-border-subtle score-panel-bg text-text-primary grid justify-items-center gap-3 py-3.5 px-3">
      <span className="typo-small text-text-muted text-center">{label}</span>
      <div
        aria-live="polite"
        className="w-[92px] h-[92px] rounded-[24px] score-display-bg grid place-items-center text-[42px] font-extrabold leading-none"
      >
        {safeValue === "" ? "0" : safeValue}
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          disabled={disabled}
          aria-label={`Bajar marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, -1))}
          className={`min-h-[42px] rounded-md score-btn text-text-primary text-[20px] font-bold ${disabledCls}`}
        >
          -
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Subir marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, 1))}
          className={`min-h-[42px] rounded-md score-btn text-text-primary text-[20px] font-bold ${disabledCls}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Components ─────────────────────────────────────────

export function Card<T extends ElementType = "div">({
  as,
  children,
  className,
  elevated = false,
  style,
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      {...props}
      className={`card-base grid gap-3.5 p-4.5 ${elevated ? "card-elevated-bg" : ""} ${className ?? ""}`}
      style={style}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({ action, align = "start", description, eyebrow, title }: SectionHeaderProps) {
  return (
    <div className={`flex justify-between gap-3 flex-wrap ${align === "center" ? "items-center" : "items-end"}`}>
      <div className={`grid gap-2 ${align === "center" ? "text-center" : ""}`}>
        {eyebrow ? <span className="typo-eyebrow">{eyebrow}</span> : null}
        <div className="grid gap-[6px]">
          <h2 className="typo-h3 m-0 text-text-primary">{title}</h2>
          {description ? <p className="typo-body m-0 text-text-secondary">{description}</p> : null}
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function Button({
  children,
  disabled = false,
  fullWidth = false,
  loading = false,
  style,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`btn-base btn-${variant} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={style}
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}

export function StatusTag({ status, label }: StatusTagProps) {
  return (
    <span className={`status-tag status-${status}`}>
      {label ?? status}
    </span>
  );
}

export function TeamFlag({ fifaCode, flagAsset, flagUrl, name, teamName, size = "md" }: TeamFlagProps) {
  const resolvedTeamName = resolveTeamName({ name, teamName });
  const fallback = getFlagFallback(resolvedTeamName);
  const flagSrc = resolveTeamFlagSrc({ flagAsset: flagAsset ?? null, flagUrl: flagUrl ?? null });
  const sizeClass = flagSizeClasses[size];

  if (!flagSrc) {
    warnMissingFlag(resolvedTeamName, fifaCode);
  }

  return (
    <>
      {flagSrc ? (
        <img
          src={flagSrc}
          alt=""
          width={flagSizes[size]}
          height={flagSizes[size]}
          className={`${sizeClass} rounded-pill object-cover border border-border-default shadow-[0_1px_3px_rgba(15,23,42,0.08)]`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${sizeClass} rounded-pill inline-flex items-center justify-center flag-fallback-bg text-text-primary border border-border-default text-[10px] font-bold`}
        >
          {fallback}
        </span>
      )}
    </>
  );
}

export function TeamIdentityRow({
  align = "start",
  code,
  fifaCode,
  flagAsset,
  flagUrl,
  name,
  teamName,
  size = "md",
  weight = 600
}: TeamIdentityRowProps) {
  const resolvedTeamName = resolveTeamName({ name, teamName });

  return (
    <div className={`flex items-center gap-2.5 ${align === "center" ? "justify-center" : "justify-start"}`}>
      <TeamFlag fifaCode={fifaCode} flagAsset={flagAsset} flagUrl={flagUrl} name={name} teamName={teamName} size={size} />
      <div className="grid gap-[2px]">
        <span className={`${teamTextClasses[size]} leading-[1.2] text-text-primary ${weightClasses[weight]}`}>
          {resolvedTeamName}
        </span>
        {code ? <span className={`typo-small text-text-faint ${codeTextClasses[size]}`}>{code}</span> : null}
      </div>
    </div>
  );
}

export function TeamDisplay(props: TeamDisplayProps) {
  return <TeamIdentityRow {...props} />;
}

export function NextMatchHero({
  awayTeam,
  ctaLabel,
  eyebrow,
  helperText,
  homeTeam,
  metaLabel,
  onAction,
  onSecondaryAction,
  secondaryCtaLabel,
  status,
  statusLabel,
  title
}: NextMatchHeroProps) {
  return (
    <Card
      elevated
      className={status === "locked" ? "hero-locked-bg" : "hero-editable-bg"}
      style={{ gap: 12, padding: 16 }}
    >
      <div className="flex justify-between gap-3 items-start flex-wrap">
        <div className="grid gap-1">
          <span className={`typo-small ${status === "locked" ? "text-gold" : "text-primary-500"}`}>{eyebrow}</span>
          <h2 className="typo-h2 m-0 text-text-primary">{title}</h2>
          <span className="typo-body text-text-secondary">{metaLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div className="grid gap-3">
        <TeamIdentityRow {...homeTeam} size="lg" weight={700} />
        <div className="pl-[44px] text-[12px] text-text-muted font-bold tracking-[0.08em]">VS</div>
        <TeamIdentityRow {...awayTeam} size="lg" weight={700} />
      </div>

      {helperText ? (
        <div className="surface-inset grid gap-3 p-3.5">
          <span className="typo-body text-text-primary font-semibold">{helperText}</span>
        </div>
      ) : null}

      <div className="flex gap-2.5 flex-wrap">
        <Button fullWidth={!secondaryCtaLabel} onClick={onAction}>
          {ctaLabel}
        </Button>
        {secondaryCtaLabel ? (
          <Button variant="ghost" onClick={onSecondaryAction}>
            {secondaryCtaLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function ProgressCompact({ items }: ProgressCompactProps) {
  return (
    <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
      {items.map((item) => (
        <div key={item.label} className="surface-inset grid gap-[6px] p-3.5">
          <span className="typo-small text-text-muted">{item.label}</span>
          <strong className="text-[24px] leading-none text-text-primary">{item.value}</strong>
          <span className="text-[13px] leading-[1.35] text-text-secondary">{item.hint}</span>
        </div>
      ))}
    </div>
  );
}

export function AdSlotCard({ description, title = "Publicidad" }: AdSlotCardProps) {
  return (
    <Card className="ad-slot-bg" style={{ gap: 8, padding: 16 }}>
      <span className="typo-small text-text-muted">{title}</span>
      <p className="typo-body m-0 text-text-secondary">{description}</p>
    </Card>
  );
}

export function MatchCard({
  awayTeam,
  ctaLabel,
  homeTeam,
  kickoffLabel,
  onAction,
  predictionSummary,
  resultSummary,
  stageLabel,
  status,
  statusLabel
}: MatchCardProps) {
  const isActionable = status === "editable" || status === "live";

  return (
    <Card elevated style={{ gap: 10, padding: 12 }}>
      <div className="flex justify-between items-center gap-2.5 flex-wrap">
        <div className="grid gap-[6px]">
          <span className="typo-eyebrow">{stageLabel}</span>
          <span className="text-[13px] leading-[1.35] text-text-secondary">{kickoffLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div className="grid gap-2">
        <TeamIdentityRow {...homeTeam} size="md" weight={700} />
        <TeamIdentityRow {...awayTeam} size="md" weight={700} />
      </div>

      <div className="flex justify-between items-start gap-2.5 py-2.5 px-3 rounded-md prediction-row-bg flex-wrap">
        <p className="typo-body m-0 text-text-primary font-semibold flex-[1_1_220px]">
          {predictionSummary ?? "Aun no predijiste este partido"}
        </p>
        {resultSummary ? (
          <p className="m-0 text-[13px] leading-[1.35] text-text-secondary flex-[1_1_220px] text-left">
            {resultSummary}
          </p>
        ) : null}
      </div>

      <Button variant={isActionable ? "primary" : "secondary"} fullWidth onClick={onAction} style={{ minHeight: 44 }}>
        {ctaLabel}
      </Button>
    </Card>
  );
}

export function ScoreInput({
  awayLabel = "Visitante",
  awayValue,
  classifierLabel = "Quien clasifica",
  classifierOptions = [],
  classifierValue = "",
  disabled,
  error,
  homeLabel = "Local",
  homeValue,
  onAwayChange,
  onClassifierChange,
  onHomeChange
}: ScoreInputProps) {
  const showClassifier = classifierOptions.length > 0;
  const disabledCls = disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer";

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        {renderScoreInput(homeLabel, homeValue, disabled, onHomeChange)}
        <div
          aria-hidden="true"
          className="w-9 h-9 rounded-pill grid place-items-center text-text-muted bg-bg-inset border border-border-subtle"
        >
          -
        </div>
        {renderScoreInput(awayLabel, awayValue, disabled, onAwayChange)}
      </div>

      {showClassifier ? (
        <div className="grid gap-2">
          <span className="typo-small text-text-secondary">{classifierLabel}</span>
          <div className="grid gap-2">
            {classifierOptions.map((option) => {
              const isActive = option.value === classifierValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  className={`classifier-option ${isActive ? "classifier-active" : "classifier-inactive"} ${disabledCls}`}
                  onClick={() => onClassifierChange?.(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p className="m-0 text-[13px] leading-[1.4] text-error">{error}</p> : null}
    </div>
  );
}

export function PredictionModal({
  awayTeam,
  children,
  helperText,
  homeTeam,
  isOpen,
  kickoffLabel,
  onClose,
  onSubmit,
  saveLabel = "Guardar prediccion",
  saving = false,
  stageLabel,
  title = "Tu proximo partido"
}: PredictionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 p-3 modal-overlay flex items-end justify-center z-50"
    >
      <div className="w-full max-w-[560px] card-base grid gap-4.5 p-4.5 shadow-modal rounded-t-xl rounded-b-lg modal-content-bg">
        <div className="flex justify-between items-start gap-3">
          <div className="grid gap-2">
            <span className="typo-eyebrow">{stageLabel}</span>
            <h2 className="typo-h2 m-0 text-text-primary">{title}</h2>
            <p className="m-0 text-[14px] leading-[1.4] text-text-secondary">{kickoffLabel}</p>
          </div>
          {onClose ? (
            <button type="button" aria-label="Cerrar" onClick={onClose} className="close-btn">
              X
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 p-4.5 rounded-lg matchup-panel-bg">
          <TeamIdentityRow {...homeTeam} align="center" size="lg" weight={700} />
          <div className="text-center text-text-muted text-[12px] font-bold tracking-[0.08em]">VS</div>
          <TeamIdentityRow {...awayTeam} align="center" size="lg" weight={700} />
        </div>

        {helperText ? (
          <div className="grid gap-[6px] py-3 px-3.5 rounded-md bg-bg-inset border border-border-subtle">
            <p className="typo-body m-0 text-text-secondary">{helperText}</p>
          </div>
        ) : null}

        {children}

        <div className="grid gap-2">
          <Button fullWidth onClick={onSubmit} loading={saving}>
            {saveLabel}
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Mas tarde
          </Button>
        </div>
      </div>
    </div>
  );
}
