import type { MatchSummary } from "@prode/shared";
import type { NextMatchHeroProps } from "@prode/ui";
import { canEditPrediction } from "@/lib/matches/editability";
import { copyForLocale, type AppLocale } from "@/lib/i18n/locale-provider";
import { toLocalKickoffLabel, toStageLabel } from "@/components/matches/matches-helpers";
import { toEditWindowLabel } from "@/components/home/home-helpers";
import type { HeroState } from "./pick-contextual-hero";

export type ToHeroPropsInput = {
  match: MatchSummary;
  state: HeroState;
  locale: AppLocale;
  onAction: () => void;
  now?: Date;
};

export type ContextualHeroProps = Pick<
  NextMatchHeroProps,
  | "awayTeam"
  | "ctaDisabled"
  | "ctaLabel"
  | "eyebrow"
  | "helperText"
  | "homeTeam"
  | "metaLabel"
  | "onAction"
  | "score"
  | "status"
  | "statusLabel"
  | "title"
>;

function parsePredictionScore(summary: string | null | undefined): { home: string; away: string } | null {
  if (!summary) {
    return null;
  }
  const match = summary.match(/^(\d+)-(\d+)/);
  if (!match) {
    return null;
  }
  return { home: match[1], away: match[2] };
}

export function toHeroProps({
  match,
  state,
  locale,
  onAction,
  now = new Date()
}: ToHeroPropsInput): ContextualHeroProps {
  const hasPrediction = Boolean(match.userPredictionSummary);
  const isEditable = canEditPrediction(match);
  const isLive = match.status === "live";

  const eyebrow = isLive
    ? copyForLocale(locale, "EN VIVO", "LIVE")
    : state === "pending"
      ? copyForLocale(locale, "TU PROXIMO", "YOUR NEXT")
      : copyForLocale(locale, "PROXIMO PARTIDO", "NEXT MATCH");

  const metaLabel = `${toStageLabel(match.stage, match.groupId, locale)} · ${toLocalKickoffLabel(match.kickoffAt, locale)}`;

  let helperText: string | undefined;
  if (state === "up-to-date" && hasPrediction) {
    helperText = copyForLocale(
      locale,
      `Tu prediccion: ${match.userPredictionSummary}`,
      `Your prediction: ${match.userPredictionSummary}`
    );
  } else if (state === "pending" && isEditable) {
    helperText = toEditWindowLabel(match.deadlineAt, locale, now);
  }

  const ctaLabel = hasPrediction
    ? copyForLocale(locale, "Editar", "Edit")
    : copyForLocale(locale, "Predecir", "Predict");
  const ctaDisabled = !isEditable;

  let status: NextMatchHeroProps["status"];
  let statusLabel: string;
  if (isLive) {
    status = "live";
    statusLabel = copyForLocale(locale, "En vivo", "Live");
  } else if (!isEditable) {
    status = "neutral";
    statusLabel = copyForLocale(locale, "Programado", "Scheduled");
  } else if (hasPrediction) {
    status = "saved";
    statusLabel = copyForLocale(locale, "Guardado", "Saved");
  } else {
    status = "editable";
    statusLabel = copyForLocale(locale, "Pendiente", "Pending");
  }

  return {
    awayTeam: {
      teamName: match.awayTeam.name,
      fifaCode: match.awayTeam.fifaCode,
      flagAsset: match.awayTeam.flagAsset,
      flagUrl: match.awayTeam.flagUrl
    },
    homeTeam: {
      teamName: match.homeTeam.name,
      fifaCode: match.homeTeam.fifaCode,
      flagAsset: match.homeTeam.flagAsset,
      flagUrl: match.homeTeam.flagUrl
    },
    ctaDisabled,
    ctaLabel,
    eyebrow,
    helperText,
    metaLabel,
    onAction,
    score: parsePredictionScore(match.userPredictionSummary),
    status,
    statusLabel,
    title: `${match.homeTeam.name} vs ${match.awayTeam.name}`
  };
}
