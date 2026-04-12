import React from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode
} from "react";
import { colors, radii, shadows, spacing, surfaceStyle, typography } from "./tokens";

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

function surfaceInsetStyle(): CSSProperties {
  return {
    display: "grid",
    gap: spacing[12],
    padding: spacing[14],
    borderRadius: radii.md,
    background: `linear-gradient(180deg, ${colors.bgInset} 0%, rgba(255, 255, 255, 0.02) 100%)`,
    border: `1px solid ${colors.borderSubtle}`
  };
}

const buttonToneStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: `linear-gradient(180deg, ${colors.primary400} 0%, ${colors.primary500} 52%, ${colors.primary600} 100%)`,
    color: colors.textPrimary,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 14px 28px rgba(47, 107, 255, 0.24)"
  },
  secondary: {
    background: `linear-gradient(180deg, rgba(28, 45, 72, 0.96) 0%, rgba(19, 33, 54, 0.96) 100%)`,
    color: colors.textPrimary,
    border: "1px solid rgba(92, 141, 255, 0.2)",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)"
  },
  ghost: {
    background: "transparent",
    color: colors.textSecondary,
    border: `1px solid ${colors.borderSubtle}`
  }
};

const statusToneStyles: Record<StatusTone, CSSProperties> = {
  editable: {
    background: colors.primarySoft,
    color: "#AFC4FF",
    border: "1px solid rgba(47, 107, 255, 0.28)"
  },
  locked: {
    background: "rgba(148, 163, 184, 0.12)",
    color: "#D5DDE7",
    border: "1px solid rgba(148, 163, 184, 0.2)"
  },
  live: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#F7C15A",
    border: "1px solid rgba(245, 158, 11, 0.24)"
  },
  scored: {
    background: "rgba(34, 197, 94, 0.14)",
    color: "#9BE5B6",
    border: "1px solid rgba(34, 197, 94, 0.24)"
  }
};

const cardBaseStyle: CSSProperties = {
  ...surfaceStyle,
  display: "grid",
  gap: spacing[14],
  padding: spacing[18],
  boxShadow: shadows.soft,
  backdropFilter: "blur(16px)"
};

const eyebrowStyle: CSSProperties = {
  ...typography.small,
  color: colors.textMuted,
  textTransform: "uppercase"
};

const missingFlagWarnings = new Set<string>();

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "start" | "center";
};

function resolveTeamName(team: Pick<TeamDisplayProps, "name" | "teamName">) {
  return team.teamName ?? team.name ?? "Seleccion";
}

function resolveTeamFlagSrc(team: Pick<TeamDisplayProps, "flagAsset" | "flagUrl">) {
  return team.flagAsset ?? team.flagUrl ?? null;
}

function warnMissingFlag(teamName: string, fifaCode?: string | null) {
  const runtime = globalThis as { process?: { env?: { NODE_ENV?: string } } };

  if (runtime.process?.env?.NODE_ENV === "production") {
    return;
  }

  const key = `${fifaCode ?? "unknown"}:${teamName}`;

  if (missingFlagWarnings.has(key)) {
    return;
  }

  missingFlagWarnings.add(key);
  console.warn(`[ui] Missing flag asset for ${teamName}${fifaCode ? ` (${fifaCode})` : ""}.`);
}

function getFlagFallback(teamName: string) {
  return teamName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function getTeamStyles(size: TeamDisplayProps["size"] = "md") {
  if (size === "lg") {
    return {
      flagSize: 34,
      fontSize: 18,
      codeSize: 11
    };
  }

  if (size === "sm") {
    return {
      flagSize: 22,
      fontSize: 14,
      codeSize: 10
    };
  }

  return {
    flagSize: 28,
    fontSize: 16,
    codeSize: 10
  };
}

function normalizeScoreValue(value: string) {
  if (value === "") {
    return "";
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return "";
  }

  return String(parsed);
}

function stepScoreValue(value: string, delta: number) {
  const current = value === "" ? 0 : Number.parseInt(value, 10);
  const next = Math.max(0, current + delta);

  return String(next);
}

function renderScoreInput(
  label: string,
  value: string,
  disabled: boolean | undefined,
  onChange: ((value: string) => void) | undefined
) {
  const safeValue = normalizeScoreValue(value);

  return (
    <div
      style={{
        width: "100%",
        minHeight: 144,
        borderRadius: radii.lg,
        border: `1px solid ${colors.borderSubtle}`,
        background: `linear-gradient(180deg, rgba(7, 17, 31, 0.98) 0%, rgba(13, 25, 43, 0.98) 100%)`,
        color: colors.textPrimary,
        display: "grid",
        justifyItems: "center",
        gap: spacing[12],
        padding: `${spacing[14]}px ${spacing[12]}px`
      }}
    >
      <span style={{ ...typography.small, color: colors.textMuted, textAlign: "center" }}>{label}</span>
      <div
        aria-live="polite"
        style={{
          width: 92,
          height: 92,
          borderRadius: 24,
          border: "1px solid rgba(92, 141, 255, 0.2)",
          background: `radial-gradient(circle at top, rgba(92, 141, 255, 0.18), transparent 48%), linear-gradient(180deg, ${colors.bgInteractive} 0%, ${colors.bgMuted} 100%)`,
          display: "grid",
          placeItems: "center",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          fontSize: 42,
          fontWeight: 800,
          lineHeight: 1
        }}
      >
        {safeValue === "" ? "0" : safeValue}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing[8], width: "100%" }}>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Bajar marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, -1))}
          style={{
            minHeight: 42,
            borderRadius: radii.md,
            border: `1px solid ${colors.border}`,
            background: colors.bgInset,
            color: colors.textPrimary,
            fontSize: 20,
            fontWeight: 700,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1
          }}
        >
          -
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Subir marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, 1))}
          style={{
            minHeight: 42,
            borderRadius: radii.md,
            border: `1px solid ${colors.border}`,
            background: colors.bgInset,
            color: colors.textPrimary,
            fontSize: 20,
            fontWeight: 700,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Card<T extends ElementType = "div">({ as, children, elevated = false, style, ...props }: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      {...props}
      style={{
        ...cardBaseStyle,
        boxShadow: elevated ? shadows.card : undefined,
        background: elevated
          ? `linear-gradient(180deg, ${colors.bgElevated} 0%, ${colors.bgSurface} 100%)`
          : surfaceStyle.background,
        ...style
      }}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({ action, align = "start", description, eyebrow, title }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: align === "center" ? "center" : "flex-end",
        gap: spacing[12],
        flexWrap: "wrap"
      }}
    >
      <div style={{ display: "grid", gap: spacing[8], textAlign: align }}>
        {eyebrow ? <span style={eyebrowStyle}>{eyebrow}</span> : null}
        <div style={{ display: "grid", gap: 6 }}>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{title}</h2>
          {description ? <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{description}</p> : null}
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
      style={{
        minHeight: 46,
        padding: "0 15px",
        borderRadius: radii.lg,
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontSize: typography.body.fontSize,
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled ? 0.6 : 1,
        transition: "transform 140ms ease, opacity 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease",
        ...buttonToneStyles[variant],
        ...style
      }}
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}

export function StatusTag({ status, label }: StatusTagProps) {
  return (
    <span
      style={{
        ...typography.small,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "fit-content",
        minHeight: 26,
        padding: "0 11px",
        borderRadius: radii.pill,
        fontWeight: 700,
        letterSpacing: "0.06em",
        ...statusToneStyles[status]
      }}
    >
      {label ?? status}
    </span>
  );
}

export function TeamFlag({ fifaCode, flagAsset, flagUrl, name, teamName, size = "md" }: TeamFlagProps) {
  const resolvedTeamName = resolveTeamName({ name, teamName });
  const fallback = getFlagFallback(resolvedTeamName);
  const teamStyles = getTeamStyles(size);
  const flagSrc = resolveTeamFlagSrc({ flagAsset: flagAsset ?? null, flagUrl: flagUrl ?? null });

  if (!flagSrc) {
    warnMissingFlag(resolvedTeamName, fifaCode);
  }

  return (
    <>
      {flagSrc ? (
        <img
          src={flagSrc}
          alt=""
          width={teamStyles.flagSize}
          height={teamStyles.flagSize}
          style={{
            borderRadius: radii.pill,
            objectFit: "cover",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 8px 18px rgba(2, 8, 18, 0.2)"
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: teamStyles.flagSize,
            height: teamStyles.flagSize,
            borderRadius: radii.pill,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(180deg, ${colors.primarySurface} 0%, ${colors.bgElevated} 100%)`,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            fontSize: 10,
            fontWeight: 700
          }}
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
  const teamStyles = getTeamStyles(size);
  const resolvedTeamName = resolveTeamName({ name, teamName });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: 10
      }}
    >
      <TeamFlag fifaCode={fifaCode} flagAsset={flagAsset} flagUrl={flagUrl} name={name} teamName={teamName} size={size} />
      <div style={{ display: "grid", gap: 2 }}>
        <span style={{ fontSize: teamStyles.fontSize, lineHeight: 1.2, color: colors.textPrimary, fontWeight: weight }}>{resolvedTeamName}</span>
        {code ? <span style={{ ...typography.small, color: colors.textFaint, fontSize: teamStyles.codeSize }}>{code}</span> : null}
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
      style={{
        gap: spacing[12],
        padding: spacing[16],
        background:
          status === "locked"
            ? `radial-gradient(circle at top right, rgba(231, 198, 106, 0.12), transparent 28%), linear-gradient(180deg, ${colors.bgElevated} 0%, ${colors.bgCanvas} 100%)`
            : `radial-gradient(circle at top right, rgba(47, 107, 255, 0.16), transparent 28%), linear-gradient(180deg, ${colors.bgElevated} 0%, ${colors.bgCanvas} 100%)`
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ ...typography.small, color: status === "locked" ? colors.gold500 : colors.primary500 }}>{eyebrow}</span>
          <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>{title}</h2>
          <span style={{ ...typography.body, color: colors.textSecondary }}>{metaLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div style={{ display: "grid", gap: spacing[12] }}>
        <TeamIdentityRow {...homeTeam} size="lg" weight={700} />
        <div style={{ paddingLeft: 44, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
        <TeamIdentityRow {...awayTeam} size="lg" weight={700} />
      </div>

      {helperText ? (
        <div style={surfaceInsetStyle()}>
          <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>{helperText}</span>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
    <div style={{ display: "grid", gap: spacing[10], gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
      {items.map((item) => (
        <div key={item.label} style={{ ...surfaceInsetStyle(), gap: 6, padding: spacing[14] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>{item.label}</span>
          <strong style={{ fontSize: 24, lineHeight: 1, color: colors.textPrimary }}>{item.value}</strong>
          <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>{item.hint}</span>
        </div>
      ))}
    </div>
  );
}

export function AdSlotCard({ description, title = "Publicidad" }: AdSlotCardProps) {
  return (
    <Card
      style={{
        gap: spacing[8],
        padding: spacing[16],
        background: `linear-gradient(180deg, ${colors.bgInteractive} 0%, ${colors.bgSurface} 100%)`
      }}
    >
      <span style={{ ...typography.small, color: colors.textMuted }}>{title}</span>
      <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{description}</p>
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
    <Card elevated style={{ gap: spacing[10], padding: spacing[12] }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing[10], flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <span style={eyebrowStyle}>{stageLabel}</span>
          <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>{kickoffLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <TeamIdentityRow {...homeTeam} size="md" weight={700} />
        <TeamIdentityRow {...awayTeam} size="md" weight={700} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing[10],
          padding: `${spacing[10]}px ${spacing[12]}px`,
          borderRadius: radii.md,
          background: "rgba(255, 255, 255, 0.025)",
          border: `1px solid ${colors.borderSubtle}`,
          flexWrap: "wrap"
        }}
      >
        <p style={{ ...typography.body, margin: 0, color: colors.textPrimary, fontWeight: 600, flex: "1 1 220px" }}>
          {predictionSummary ?? "Aun no predijiste este partido"}
        </p>
        {resultSummary ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.35, color: colors.textSecondary, flex: "1 1 220px", textAlign: "left" }}>
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

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)", alignItems: "center" }}>
        {renderScoreInput(homeLabel, homeValue, disabled, onHomeChange)}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.pill,
            display: "grid",
            placeItems: "center",
            color: colors.textMuted,
            background: colors.bgInset,
            border: `1px solid ${colors.borderSubtle}`
          }}
        >
          -
        </div>
        {renderScoreInput(awayLabel, awayValue, disabled, onAwayChange)}
      </div>

      {showClassifier ? (
        <div style={{ display: "grid", gap: spacing[8] }}>
          <span style={{ ...typography.small, color: colors.textSecondary }}>{classifierLabel}</span>
          <div style={{ display: "grid", gap: spacing[8] }}>
            {classifierOptions.map((option) => {
              const isActive = option.value === classifierValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  style={{
                    minHeight: 48,
                    borderRadius: radii.md,
                    border: isActive ? "1px solid rgba(47, 107, 255, 0.4)" : `1px solid ${colors.border}`,
                    background: isActive ? colors.primarySoft : colors.bgInset,
                    color: colors.textPrimary,
                    textAlign: "left",
                    padding: "0 14px",
                    fontSize: typography.body.fontSize,
                    fontWeight: 600,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.7 : 1
                  }}
                  onClick={() => onClassifierChange?.(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: "#FCA5A5" }}>{error}</p> : null}
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
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        padding: spacing[12],
        background: colors.overlay,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
        zIndex: 50
      }}
    >
      <div
        style={{
          width: "min(100%, 560px)",
          ...cardBaseStyle,
          gap: spacing[18],
          boxShadow: shadows.modal,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          borderBottomLeftRadius: radii.lg,
          borderBottomRightRadius: radii.lg,
          background: `linear-gradient(180deg, ${colors.bgElevated} 0%, ${colors.bgCanvas} 100%)`
        }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[12] }}>
            <div style={{ display: "grid", gap: spacing[8] }}>
              <span style={eyebrowStyle}>{stageLabel}</span>
              <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>{title}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>{kickoffLabel}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.pill,
                border: `1px solid ${colors.borderSubtle}`,
                background: colors.bgInset,
                color: colors.textSecondary,
                cursor: "pointer"
              }}
            >
              X
            </button>
          ) : null}
        </div>

        <div
          style={{
          display: "grid",
          gap: spacing[12],
          padding: spacing[18],
          borderRadius: radii.lg,
          background: `radial-gradient(circle at top, rgba(92, 141, 255, 0.12), transparent 42%), linear-gradient(180deg, ${colors.bgCanvas} 0%, ${colors.bgSurface} 100%)`,
          border: `1px solid ${colors.borderSubtle}`
          }}
        >
          <TeamIdentityRow {...homeTeam} align="center" size="lg" weight={700} />
          <div style={{ textAlign: "center", color: colors.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
          <TeamIdentityRow {...awayTeam} align="center" size="lg" weight={700} />
        </div>

        {helperText ? (
          <div
            style={{
              display: "grid",
              gap: 6,
              padding: `${spacing[12]}px ${spacing[14]}px`,
              borderRadius: radii.md,
              background: colors.bgInset,
              border: `1px solid ${colors.borderSubtle}`
            }}
          >
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{helperText}</p>
          </div>
        ) : null}

        {children}

        <div style={{ display: "grid", gap: 8 }}>
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
