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

export type TeamDisplayProps = {
  flagUrl?: string | null;
  teamName: string;
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

const buttonToneStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: colors.primary500,
    color: colors.textPrimary,
    border: "none",
    boxShadow: "0 10px 24px rgba(47, 107, 255, 0.24)"
  },
  secondary: {
    background: colors.bgMuted,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderStrong}`
  },
  ghost: {
    background: "rgba(255, 255, 255, 0.02)",
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`
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
  gap: spacing[16],
  padding: spacing[20],
  backdropFilter: "blur(14px)"
};

const eyebrowStyle: CSSProperties = {
  ...typography.small,
  color: colors.textMuted,
  textTransform: "uppercase"
};

const scoreBoxStyle: CSSProperties = {
  width: "100%",
  minHeight: 104,
  borderRadius: radii.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(8, 18, 33, 0.98) 0%, rgba(14, 26, 43, 0.98) 100%)",
  color: colors.textPrimary,
  display: "grid",
  justifyItems: "center",
  gap: spacing[8],
  padding: `${spacing[16]}px ${spacing[12]}px`
};

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
      fontSize: 18
    };
  }

  if (size === "sm") {
    return {
      flagSize: 22,
      fontSize: 14
    };
  }

  return {
    flagSize: 28,
    fontSize: 16
  };
}

function renderScoreInput(
  label: string,
  value: string,
  disabled: boolean | undefined,
  onChange: ((value: string) => void) | undefined
) {
  return (
    <label style={scoreBoxStyle}>
      <span style={{ ...typography.small, color: colors.textMuted }}>{label}</span>
      <input
        value={value}
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        style={{
          width: 76,
          height: 76,
          borderRadius: radii.md,
          border: `1px solid ${colors.borderStrong}`,
          background: colors.bgMuted,
          color: colors.textPrimary,
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          outline: "none",
          opacity: disabled ? 0.7 : 1
        }}
        onChange={(event) => onChange?.(event.target.value.replace(/\D+/g, ""))}
      />
    </label>
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
          ? "linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(14, 26, 43, 0.98) 100%)"
          : surfaceStyle.background,
        ...style
      }}
    >
      {children}
    </Component>
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
        minHeight: 52,
        padding: "0 18px",
        borderRadius: 16,
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontSize: typography.body.fontSize,
        fontWeight: 600,
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled ? 0.6 : 1,
        transition: "transform 140ms ease, opacity 140ms ease, background 140ms ease, border-color 140ms ease",
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
        minHeight: 28,
        padding: "0 10px",
        borderRadius: radii.pill,
        fontWeight: 700,
        letterSpacing: "0.04em",
        ...statusToneStyles[status]
      }}
    >
      {label ?? status}
    </span>
  );
}

export function TeamDisplay({ align = "start", flagUrl, teamName, size = "md", weight = 600 }: TeamDisplayProps) {
  const fallback = getFlagFallback(teamName);
  const teamStyles = getTeamStyles(size);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: spacing[12]
      }}
    >
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          width={teamStyles.flagSize}
          height={teamStyles.flagSize}
          style={{
            borderRadius: radii.pill,
            objectFit: "cover",
            border: `1px solid ${colors.borderStrong}`,
            boxShadow: "0 6px 16px rgba(2, 8, 18, 0.22)"
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
            background: "linear-gradient(180deg, rgba(47, 107, 255, 0.22) 0%, rgba(16, 29, 49, 1) 100%)",
            color: colors.textPrimary,
            border: `1px solid ${colors.borderStrong}`,
            fontSize: 10,
            fontWeight: 700
          }}
        >
          {fallback}
        </span>
      )}
      <span style={{ fontSize: teamStyles.fontSize, lineHeight: 1.2, color: colors.textPrimary, fontWeight: weight }}>{teamName}</span>
    </div>
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
  return (
    <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[12] }}>
        <div style={{ display: "grid", gap: 6 }}>
          <span style={eyebrowStyle}>{stageLabel}</span>
          <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>{kickoffLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <TeamDisplay {...homeTeam} size="lg" weight={700} />
        <span style={{ ...typography.small, color: colors.textMuted, paddingLeft: 46 }}>VS</span>
        <TeamDisplay {...awayTeam} size="lg" weight={700} />
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          padding: 14,
          borderRadius: radii.md,
          background: "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${colors.border}`
        }}
      >
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: colors.textPrimary, fontWeight: 600 }}>
          {predictionSummary ?? "Aun no predijiste este partido"}
        </p>
        {resultSummary ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>{resultSummary}</p> : null}
      </div>

      <Button variant={status === "locked" ? "secondary" : "primary"} fullWidth onClick={onAction}>
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
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${colors.border}`
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
                    minHeight: 50,
                    borderRadius: radii.md,
                    border: isActive ? "1px solid rgba(47, 107, 255, 0.4)" : `1px solid ${colors.border}`,
                    background: isActive ? colors.primarySoft : "rgba(255, 255, 255, 0.03)",
                    color: colors.textPrimary,
                    textAlign: "left",
                    padding: "0 14px",
                    fontSize: 15,
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
          gap: spacing[20],
          boxShadow: shadows.modal,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          borderBottomLeftRadius: radii.lg,
          borderBottomRightRadius: radii.lg,
          background: "linear-gradient(180deg, rgba(16, 29, 49, 0.99) 0%, rgba(10, 21, 35, 0.99) 100%)"
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
                border: `1px solid ${colors.border}`,
                background: "rgba(255, 255, 255, 0.03)",
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
            padding: spacing[16],
            borderRadius: radii.lg,
            background: "linear-gradient(180deg, rgba(7, 17, 31, 1) 0%, rgba(13, 25, 43, 1) 100%)",
            border: `1px solid ${colors.border}`
          }}
        >
          <TeamDisplay {...homeTeam} align="center" size="lg" weight={700} />
          <div style={{ textAlign: "center", color: colors.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
          <TeamDisplay {...awayTeam} align="center" size="lg" weight={700} />
        </div>

        {helperText ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>{helperText}</p> : null}

        {children}

        <div style={{ display: "grid", gap: 10 }}>
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
