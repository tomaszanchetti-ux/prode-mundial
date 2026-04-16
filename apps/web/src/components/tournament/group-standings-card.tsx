import React from "react";
import type { TuMundialGroupCard } from "@prode/shared";
import { Card, StatusTag, TeamIdentity } from "@prode/ui";

type GroupStandingsCardProps = {
  group: TuMundialGroupCard;
};

function toGroupState(group: TuMundialGroupCard) {
  if (group.completedMatches === 0) {
    return {
      label: "Pendiente",
      tone: "locked" as const,
      copy: "Todavia no moviste este grupo."
    };
  }

  if (group.isComplete) {
    return {
      label: "Cerrado",
      tone: "scored" as const,
      copy: "Asi quedaria el grupo si el Mundial terminara segun tus pronosticos."
    };
  }

  return {
    label: "Parcial",
    tone: "editable" as const,
    copy: "La tabla sigue viva y todavia puede cambiar."
  };
}

export function GroupStandingsCard({ group }: GroupStandingsCardProps) {
  const state = toGroupState(group);

  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <div className="flex justify-between items-start gap-3">
        <div className="grid gap-1">
          <span className="typo-small text-text-muted">{group.groupName}</span>
          <strong className="text-[18px] leading-[1.25] text-text-primary">Asi va quedando la tabla</strong>
          <span className="text-[13px] leading-[1.35] text-text-secondary">
            {group.completedMatches} / {group.totalMatches} partidos proyectados
          </span>
        </div>
        <StatusTag status={state.tone} label={state.label} />
      </div>

      <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">{state.copy}</p>

      <div className="grid gap-2 p-3 rounded-[16px] surface-inset">
        <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px] gap-2 items-center">
          <span className="typo-small text-text-muted">Equipo</span>
          <span className="typo-small text-text-muted text-center">PJ</span>
          <span className="typo-small text-text-muted text-center">DG</span>
          <span className="typo-small text-text-muted text-center">Pts</span>
        </div>

        {group.items.map((item) => (
          <div
            key={item.teamId}
            className={`grid grid-cols-[minmax(0,1fr)_44px_44px_44px] gap-2 items-center px-3 py-2.5 rounded-[14px] ${
              item.isProjectedQualified
                ? "bg-primary-soft border border-[rgba(0,82,204,0.22)]"
                : "bg-bg-surface border border-border-default"
            }`}
          >
            <div className="grid gap-1">
              <span
                className={`text-[12px] leading-[1.2] ${
                  item.isProjectedQualified ? "text-primary-600 font-bold" : "text-text-muted font-semibold"
                }`}
              >
                #{item.position} {item.isProjectedQualified ? "clasifica" : ""}
              </span>
              <TeamIdentity
                team={item}
                size="sm"
                emphasis={item.isProjectedQualified ? "hero" : "default"}
              />
            </div>
            <span className="text-[14px] leading-[1.2] text-text-primary text-center">{item.played}</span>
            <span className="text-[14px] leading-[1.2] text-text-primary text-center">{item.goalDifference}</span>
            <span className="text-[14px] leading-[1.2] text-text-primary text-center font-bold">{item.points}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
