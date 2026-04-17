/**
 * FIFA 2026 group definitions for bracket hydration.
 *
 * Mirrors `WORLD_CUP_2026_GROUPS` in apps/api. Duplicated here so that the
 * jobs package stays self-contained (see the score-match comment for the
 * precedent). Keep in sync with apps/api when the competition catalog
 * changes — in practice, that is never, since FIFA fixtures are immutable
 * once published.
 */

import type { GroupDefinition } from "@prode/shared";

function team(teamId: string, teamName: string) {
  return { teamId, teamName };
}

export const BRACKET_HYDRATION_GROUPS: GroupDefinition[] = [
  {
    groupId: "A",
    teams: [team("MEX", "Mexico"), team("RSA", "South Africa"), team("KOR", "South Korea"), team("CZE", "Czech Republic")]
  },
  {
    groupId: "B",
    teams: [team("CAN", "Canada"), team("BIH", "Bosnia and Herzegovina"), team("QAT", "Qatar"), team("SUI", "Switzerland")]
  },
  {
    groupId: "C",
    teams: [team("BRA", "Brazil"), team("MAR", "Morocco"), team("HAI", "Haiti"), team("SCO", "Scotland")]
  },
  {
    groupId: "D",
    teams: [team("USA", "United States"), team("PAR", "Paraguay"), team("AUS", "Australia"), team("TUR", "Türkiye")]
  },
  {
    groupId: "E",
    teams: [team("GER", "Germany"), team("CUW", "Curaçao"), team("CIV", "Côte d'Ivoire"), team("ECU", "Ecuador")]
  },
  {
    groupId: "F",
    teams: [team("NED", "Netherlands"), team("JPN", "Japan"), team("SWE", "Sweden"), team("TUN", "Tunisia")]
  },
  {
    groupId: "G",
    teams: [team("BEL", "Belgium"), team("EGY", "Egypt"), team("IRN", "Iran"), team("NZL", "New Zealand")]
  },
  {
    groupId: "H",
    teams: [team("ESP", "Spain"), team("CPV", "Cabo Verde"), team("KSA", "Saudi Arabia"), team("URU", "Uruguay")]
  },
  {
    groupId: "I",
    teams: [team("FRA", "France"), team("SEN", "Senegal"), team("IRQ", "Iraq"), team("NOR", "Norway")]
  },
  {
    groupId: "J",
    teams: [team("ARG", "Argentina"), team("ALG", "Algeria"), team("AUT", "Austria"), team("JOR", "Jordan")]
  },
  {
    groupId: "K",
    teams: [team("POR", "Portugal"), team("COD", "DR Congo"), team("UZB", "Uzbekistan"), team("COL", "Colombia")]
  },
  {
    groupId: "L",
    teams: [team("ENG", "England"), team("CRO", "Croatia"), team("GHA", "Ghana"), team("PAN", "Panama")]
  }
];
