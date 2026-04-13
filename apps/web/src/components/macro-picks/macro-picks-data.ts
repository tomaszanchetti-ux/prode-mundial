import { resolveTeamIdentity, type MacroGroupId } from "@prode/shared";

export type MacroTeamOption = {
  teamId: string;
  name: string;
  groupId: MacroGroupId;
  flagAsset: string | null;
  flagUrl: string | null;
  fifaCode: string | null;
};

type GroupDefinition = {
  groupId: MacroGroupId;
  label: string;
  teams: Array<{ teamId: string; name: string }>;
};

const GROUP_DEFINITIONS: GroupDefinition[] = [
  { groupId: "A", label: "Grupo A", teams: [{ teamId: "MEX", name: "Mexico" }, { teamId: "RSA", name: "South Africa" }, { teamId: "KOR", name: "South Korea" }, { teamId: "CZE", name: "Czech Republic" }] },
  { groupId: "B", label: "Grupo B", teams: [{ teamId: "CAN", name: "Canada" }, { teamId: "BIH", name: "Bosnia and Herzegovina" }, { teamId: "QAT", name: "Qatar" }, { teamId: "SUI", name: "Switzerland" }] },
  { groupId: "C", label: "Grupo C", teams: [{ teamId: "BRA", name: "Brazil" }, { teamId: "MAR", name: "Morocco" }, { teamId: "HAI", name: "Haiti" }, { teamId: "SCO", name: "Scotland" }] },
  { groupId: "D", label: "Grupo D", teams: [{ teamId: "USA", name: "United States" }, { teamId: "PAR", name: "Paraguay" }, { teamId: "AUS", name: "Australia" }, { teamId: "TUR", name: "Turkey" }] },
  { groupId: "E", label: "Grupo E", teams: [{ teamId: "GER", name: "Germany" }, { teamId: "CUW", name: "Curacao" }, { teamId: "CIV", name: "Ivory Coast" }, { teamId: "ECU", name: "Ecuador" }] },
  { groupId: "F", label: "Grupo F", teams: [{ teamId: "NED", name: "Netherlands" }, { teamId: "JPN", name: "Japan" }, { teamId: "SWE", name: "Sweden" }, { teamId: "TUN", name: "Tunisia" }] },
  { groupId: "G", label: "Grupo G", teams: [{ teamId: "BEL", name: "Belgium" }, { teamId: "EGY", name: "Egypt" }, { teamId: "IRN", name: "Iran" }, { teamId: "NZL", name: "New Zealand" }] },
  { groupId: "H", label: "Grupo H", teams: [{ teamId: "ESP", name: "Spain" }, { teamId: "CPV", name: "Cape Verde" }, { teamId: "KSA", name: "Saudi Arabia" }, { teamId: "URU", name: "Uruguay" }] },
  { groupId: "I", label: "Grupo I", teams: [{ teamId: "FRA", name: "France" }, { teamId: "SEN", name: "Senegal" }, { teamId: "IRQ", name: "Iraq" }, { teamId: "NOR", name: "Norway" }] },
  { groupId: "J", label: "Grupo J", teams: [{ teamId: "ARG", name: "Argentina" }, { teamId: "ALG", name: "Algeria" }, { teamId: "AUT", name: "Austria" }, { teamId: "JOR", name: "Jordan" }] },
  { groupId: "K", label: "Grupo K", teams: [{ teamId: "POR", name: "Portugal" }, { teamId: "COD", name: "DR Congo" }, { teamId: "UZB", name: "Uzbekistan" }, { teamId: "COL", name: "Colombia" }] },
  { groupId: "L", label: "Grupo L", teams: [{ teamId: "ENG", name: "England" }, { teamId: "CRO", name: "Croatia" }, { teamId: "GHA", name: "Ghana" }, { teamId: "PAN", name: "Panama" }] }
];

export const MACRO_GROUPS = GROUP_DEFINITIONS.map((group) => ({
  ...group,
  teams: group.teams.map((team) => {
    const identity = resolveTeamIdentity(team.teamId);

    return {
      ...team,
      groupId: group.groupId,
      fifaCode: identity.fifaCode,
      flagAsset: identity.flagAsset,
      flagUrl: identity.flagUrl
    };
  })
}));

export const MACRO_ALL_TEAMS: MacroTeamOption[] = MACRO_GROUPS.flatMap((group) => group.teams);

export const MACRO_TEAM_BY_ID = new Map(MACRO_ALL_TEAMS.map((team) => [team.teamId, team]));
