import React from "react";
import type { TuMundialGroupCard } from "@prode/shared";
import { Card, StatusTag, TeamIdentity } from "@prode/ui";

type GroupStandingsCardProps = {
  group: TuMundialGroupCard;
};

function toGroupState(group: TuMundialGroupCard) {
  if (group.completedMatches === 0) {
    return {
      label: "Abierto",
      tone: "neutral" as const
    };
  }

  if (group.isComplete) {
    return {
      label: "Definido",
      tone: "scored" as const
    };
  }

  return {
    label: "En juego",
    tone: "editable" as const
  };
}

export function GroupStandingsCard({ group }: GroupStandingsCardProps) {
  const state = toGroupState(group);

  return (
    <Card elevated style={{ gap: 10, padding: 14 }}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="typo-eyebrow text-primary-600">{group.groupName}</span>
          <span className="text-[12px] leading-[1.3] text-text-muted">
            {group.completedMatches}/{group.totalMatches}
          </span>
        </div>
        <StatusTag status={state.tone} label={state.label} />
      </div>

      <div className="grid gap-[6px]">
        <div className="grid grid-cols-[minmax(0,1fr)_36px_36px_36px] gap-1.5 items-center px-2">
          <span className="text-[11px] font-semibold text-text-muted tracking-wide">EQUIPO</span>
          <span className="text-[11px] font-semibold text-text-muted text-center">PJ</span>
          <span className="text-[11px] font-semibold text-text-muted text-center">DG</span>
          <span className="text-[11px] font-semibold text-text-muted text-center">PTS</span>
        </div>

        {group.items.map((item) => {
          const qualified = item.isProjectedQualified;

          return (
            <div
              key={item.teamId}
              className={`grid grid-cols-[minmax(0,1fr)_36px_36px_36px] gap-1.5 items-center px-2 py-2 rounded-[10px] ${
                qualified
                  ? "group-row-qualified"
                  : "bg-bg-surface border border-border-default"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] leading-[1] font-bold w-[18px] text-center ${
                    qualified ? "text-primary-600" : "text-text-muted"
                  }`}
                >
                  {item.position}
                </span>
                <TeamIdentity team={item} size="sm" emphasis="compact" />
                {qualified ? (
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-soft px-1.5 py-0.5 rounded-pill whitespace-nowrap">
                    Clasifica
                  </span>
                ) : null}
              </div>
              <span className="text-[13px] leading-[1.2] text-text-primary text-center">{item.played}</span>
              <span className="text-[13px] leading-[1.2] text-text-primary text-center">{item.goalDifference}</span>
              <span className="text-[13px] leading-[1.2] text-text-primary text-center font-bold">{item.points}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
