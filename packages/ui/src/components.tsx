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
    background: `linear-gradient(135deg, ${colors.primary500} 0%, ${colors.primary700} 100%)`,
    color: colors.textPrimary,
    border: "none"
  },
  secondary: {
    background: colors.bgElevated,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderStrong}`
  },
  ghost: {
    background: "transparent",
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`
  }
};

const statusToneStyles: Record<StatusTone, CSSProperties> = {
  editable: {
    background: "rgba(59, 130, 246, 0.16)",
    color: "#93C5FD",
    border: "1px solid rgba(59, 130, 246, 0.32)"
  },
  locked: {
    background: "rgba(148, 163, 184, 0.14)",
    color: "#CBD5E1",
    border: "1px solid rgba(148, 163, 184, 0.24)"
  },
  live: {
    background: "rgba(245, 158, 11, 0.16)",
    color: "#FCD34D",
    border: "1px solid rgba(245, 158, 11, 0.26)"
  },
  scored: {
    background: "rgba(22, 163, 74, 0.16)",
    color: "#86EFAC",
    border: "1px solid rgba(22, 163, 74, 0.26)"
  }
};

const cardBaseStyle: CSSProperties = {
  ...surfaceStyle,
  display: "grid",
  gap: spacing[16],
  padding: spacing[20]
};

const eyebrowStyle: CSSProperties = {
  ...typography.small,
  color: colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const inputBaseStyle: CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: radii.md,
  border: `1px solid ${colors.borderStrong}`,
  background: colors.bgMain,
  color: colors.textPrimary,
  padding: "0 14px",
  fontSize: 22,
  fontWeight: 700,
  textAlign: "center"
};

function getFlagFallback(teamName: string) {
  return teamName.trim().slice(0, 2).toUpperCase();
}

function renderInput(
  label: string,
  value: string,
  disabled: boolean | undefined,
  onChange: ((value: string) => void) | undefined,
  inputProps?: Partial<InputHTMLAttributes<HTMLInputElement>>
) {
  return (
    <label style={{ display: "grid", gap: spacing[8] }}>
      <span style={{ ...typography.small, color: colors.textSecondary }}>{label}</span>
      <input
        {...inputProps}
        value={value}
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        style={{ ...inputBaseStyle, opacity: disabled ? 0.7 : 1 }}
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
        minHeight: 48,
        padding: "0 16px",
        borderRadius: radii.md,
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontSize: typography.body.fontSize,
        fontWeight: 600,
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled ? 0.6 : 1,
        transition: "transform 160ms ease, opacity 160ms ease, background 160ms ease",
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
        fontWeight: 600,
        textTransform: "capitalize",
        ...statusToneStyles[status]
      }}
    >
      {label ?? status}
    </span>
  );
}

export function TeamDisplay({ align = "start", flagUrl, teamName }: TeamDisplayProps) {
  const fallback = getFlagFallback(teamName);

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
          width={28}
          height={28}
          style={{ borderRadius: radii.pill, objectFit: "cover", border: `1px solid ${colors.borderStrong}` }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: radii.pill,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.bgElevated,
            color: colors.textSecondary,
            border: `1px solid ${colors.borderStrong}`,
            fontSize: 10,
            fontWeight: 700
          }}
        >
          {fallback}
        </span>
      )}
      <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>{teamName}</span>
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
  stageLabel,
  status,
  statusLabel
}: MatchCardProps) {
  return (
    <Card elevated style={{ gap: spacing[20] }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <span style={eyebrowStyle}>{stageLabel}</span>
          <span style={{ ...typography.small, color: colors.textSecondary }}>{kickoffLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div style={{ display: "grid", gap: spacing[12] }}>
        <TeamDisplay {...homeTeam} />
        <TeamDisplay {...awayTeam} />
      </div>

      <div
        style={{
          display: "grid",
          gap: spacing[12],
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "start"
        }}
      >
        <div
          style={{
            padding: spacing[16],
            borderRadius: radii.md,
            background: colors.bgMain,
            border: `1px solid ${colors.border}`
          }}
        >
          <p style={{ ...typography.small, color: colors.textMuted, margin: 0 }}>Tu prediccion</p>
          <p style={{ ...typography.body, color: colors.textPrimary, margin: "6px 0 0" }}>
            {predictionSummary ?? "Todavia no guardaste una prediccion para este partido."}
          </p>
        </div>

        <Button variant={status === "editable" ? "primary" : "secondary"} fullWidth onClick={onAction}>
          {ctaLabel}
        </Button>
      </div>
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
      <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {renderInput(homeLabel, homeValue, disabled, onHomeChange)}
        {renderInput(awayLabel, awayValue, disabled, onAwayChange)}
      </div>

      {showClassifier ? (
        <label style={{ display: "grid", gap: spacing[8] }}>
          <span style={{ ...typography.small, color: colors.textSecondary }}>{classifierLabel}</span>
          <select
            value={classifierValue}
            disabled={disabled}
            style={{
              minHeight: 48,
              borderRadius: radii.md,
              border: `1px solid ${colors.borderStrong}`,
              background: colors.bgMain,
              color: colors.textPrimary,
              padding: "0 14px"
            }}
            onChange={(event) => onClassifierChange?.(event.target.value)}
          >
            <option value="">Seleccionar</option>
            {classifierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? <p style={{ ...typography.small, color: "#FCA5A5", margin: 0 }}>{error}</p> : null}
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
  title = "Completa tu prediccion"
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
        padding: spacing[16],
        background: colors.overlay,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50
      }}
    >
      <div
        style={{
          width: "min(100%, 520px)",
          ...cardBaseStyle,
          boxShadow: shadows.modal,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <span style={eyebrowStyle}>{stageLabel}</span>
            <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>{title}</h2>
            <p style={{ ...typography.small, color: colors.textSecondary, margin: 0 }}>{kickoffLabel}</p>
          </div>
          {onClose ? (
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gap: spacing[12],
            padding: spacing[16],
            borderRadius: radii.md,
            background: colors.bgMain,
            border: `1px solid ${colors.border}`
          }}
        >
          <TeamDisplay {...homeTeam} />
          <TeamDisplay {...awayTeam} />
        </div>

        {helperText ? <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>{helperText}</p> : null}

        {children}

        <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Button variant="secondary" onClick={onClose}>
            Mas tarde
          </Button>
          <Button onClick={onSubmit} loading={saving}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
