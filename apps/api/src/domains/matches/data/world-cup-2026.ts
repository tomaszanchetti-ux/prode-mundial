export type WorldCup2026Source = {
  label: string;
  url: string;
  publishedAt: string | null;
  notes?: string;
};

export type WorldCup2026Venue = {
  venueId: string;
  city: string;
  stadium: string | null;
  timezone: string;
};

export type WorldCup2026Team = {
  teamId: string;
  fifaCode: string;
  iso2: string | null;
  iso3: string | null;
  flagAsset: string | null;
  name: string;
  shortName: string;
  flagUrl: string | null;
  groupId: string;
  isActive: boolean;
};

function buildWorldCupTeam(
  teamId: string,
  fifaCode: string,
  name: string,
  shortName: string,
  groupId: string
): WorldCup2026Team {
  const identity = getTeamIdentityByFifaCode(fifaCode);

  return {
    teamId,
    fifaCode,
    iso2: identity?.iso2 ?? null,
    iso3: identity?.iso3 ?? null,
    flagAsset: identity?.flagAsset ?? null,
    name,
    shortName,
    flagUrl: null,
    groupId,
    isActive: true
  };
}

export type WorldCup2026Group = {
  groupId: string;
  name: string;
  teamIds: string[];
  isClosed: boolean;
};

export type WorldCup2026RawScheduleSighting = {
  dateLabel: string;
  timeEt: string;
  venueId: string;
  tokens: string[];
};

export type WorldCup2026RawScheduleRow = {
  officialMatchNumber: number;
  sightings: WorldCup2026RawScheduleSighting[];
};

export type WorldCup2026NormalizedMatch = {
  matchId: string;
  officialMatchNumber: number;
  stage: "group" | "R32" | "R16" | "QF" | "SF" | "BRONZE" | "FINAL";
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSlot: string | null;
  awaySlot: string | null;
  kickoffAtEt: string;
  kickoffAtUtc: string;
  venueId: string;
  status: "scheduled";
  isLocked: boolean;
  isScored: boolean;
};

export const WORLD_CUP_2026_SOURCES: readonly WorldCup2026Source[] = [
  {
    label: "FIFA 2026 official match schedule PDF (Spanish)",
    url: "https://digitalhub.fifa.com/asset/00d96870-7dd7-48f9-9549-635a53b1bcc8/FWC26-Match-Schedule_Spanish.pdf",
    publishedAt: "2026-04-01T00:00:00Z",
    notes: "Primary source used for official match numbers, dates, kickoff times and venue placement."
  },
  {
    label: "FIFA press release - updated 2026 match schedule",
    url: "https://inside.fifa.com/es/organisation/media-releases/calendario-actualizado-copa-mundial-de-la-fifa-2026-104-partidos",
    publishedAt: "2025-12-06T19:45:00Z",
    notes: "Supporting source used to validate that the official schedule announcement and kickoff windows came from FIFA."
  }
] as const;

export const WORLD_CUP_2026_SCHEDULE_TIMEZONE = "America/New_York";

export const WORLD_CUP_2026_SCHEDULE_TIMEZONE_NOTE =
  "The official FIFA schedule PDF states that all kickoff times are expressed in ET. During June and July 2026 ET maps to UTC-4.";

export const WORLD_CUP_2026_VENUES: readonly WorldCup2026Venue[] = [
  { venueId: "vancouver", city: "Vancouver", stadium: null, timezone: "America/Vancouver" },
  { venueId: "seattle", city: "Seattle", stadium: null, timezone: "America/Los_Angeles" },
  { venueId: "san-francisco-bay-area", city: "San Francisco Bay Area", stadium: null, timezone: "America/Los_Angeles" },
  { venueId: "los-angeles", city: "Los Angeles", stadium: null, timezone: "America/Los_Angeles" },
  { venueId: "guadalajara", city: "Guadalajara", stadium: null, timezone: "America/Mexico_City" },
  { venueId: "mexico-city", city: "Mexico City", stadium: null, timezone: "America/Mexico_City" },
  { venueId: "monterrey", city: "Monterrey", stadium: null, timezone: "America/Monterrey" },
  { venueId: "houston", city: "Houston", stadium: null, timezone: "America/Chicago" },
  { venueId: "dallas", city: "Dallas", stadium: null, timezone: "America/Chicago" },
  { venueId: "kansas-city", city: "Kansas City", stadium: null, timezone: "America/Chicago" },
  { venueId: "atlanta", city: "Atlanta", stadium: null, timezone: "America/New_York" },
  { venueId: "miami", city: "Miami", stadium: null, timezone: "America/New_York" },
  { venueId: "toronto", city: "Toronto", stadium: null, timezone: "America/Toronto" },
  { venueId: "boston", city: "Boston", stadium: null, timezone: "America/New_York" },
  { venueId: "philadelphia", city: "Philadelphia", stadium: null, timezone: "America/New_York" },
  { venueId: "new-york-new-jersey", city: "New York / New Jersey", stadium: null, timezone: "America/New_York" }
] as const;

export const WORLD_CUP_2026_TEAMS: readonly WorldCup2026Team[] = [
  buildWorldCupTeam("MEX", "MEX", "Mexico", "Mexico", "A"),
  buildWorldCupTeam("RSA", "RSA", "South Africa", "South Africa", "A"),
  buildWorldCupTeam("KOR", "KOR", "Korea Republic", "Korea", "A"),
  buildWorldCupTeam("CZE", "CZE", "Czechia", "Czechia", "A"),
  buildWorldCupTeam("CAN", "CAN", "Canada", "Canada", "B"),
  buildWorldCupTeam("BIH", "BIH", "Bosnia and Herzegovina", "Bosnia", "B"),
  buildWorldCupTeam("QAT", "QAT", "Qatar", "Qatar", "B"),
  buildWorldCupTeam("SUI", "SUI", "Switzerland", "Switzerland", "B"),
  buildWorldCupTeam("BRA", "BRA", "Brazil", "Brazil", "C"),
  buildWorldCupTeam("MAR", "MAR", "Morocco", "Morocco", "C"),
  buildWorldCupTeam("HAI", "HAI", "Haiti", "Haiti", "C"),
  buildWorldCupTeam("SCO", "SCO", "Scotland", "Scotland", "C"),
  buildWorldCupTeam("USA", "USA", "United States", "USA", "D"),
  buildWorldCupTeam("PAR", "PAR", "Paraguay", "Paraguay", "D"),
  buildWorldCupTeam("AUS", "AUS", "Australia", "Australia", "D"),
  buildWorldCupTeam("TUR", "TUR", "Turkey", "Turkey", "D"),
  buildWorldCupTeam("GER", "GER", "Germany", "Germany", "E"),
  buildWorldCupTeam("CUW", "CUW", "Curacao", "Curacao", "E"),
  buildWorldCupTeam("CIV", "CIV", "Cote d'Ivoire", "Cote d'Ivoire", "E"),
  buildWorldCupTeam("ECU", "ECU", "Ecuador", "Ecuador", "E"),
  buildWorldCupTeam("NED", "NED", "Netherlands", "Netherlands", "F"),
  buildWorldCupTeam("JPN", "JPN", "Japan", "Japan", "F"),
  buildWorldCupTeam("SWE", "SWE", "Sweden", "Sweden", "F"),
  buildWorldCupTeam("TUN", "TUN", "Tunisia", "Tunisia", "F"),
  buildWorldCupTeam("BEL", "BEL", "Belgium", "Belgium", "G"),
  buildWorldCupTeam("EGY", "EGY", "Egypt", "Egypt", "G"),
  buildWorldCupTeam("IRN", "IRN", "IR Iran", "Iran", "G"),
  buildWorldCupTeam("NZL", "NZL", "New Zealand", "New Zealand", "G"),
  buildWorldCupTeam("ESP", "ESP", "Spain", "Spain", "H"),
  buildWorldCupTeam("CPV", "CPV", "Cape Verde", "Cape Verde", "H"),
  buildWorldCupTeam("KSA", "KSA", "Saudi Arabia", "Saudi Arabia", "H"),
  buildWorldCupTeam("URU", "URU", "Uruguay", "Uruguay", "H"),
  buildWorldCupTeam("FRA", "FRA", "France", "France", "I"),
  buildWorldCupTeam("SEN", "SEN", "Senegal", "Senegal", "I"),
  buildWorldCupTeam("IRQ", "IRQ", "Iraq", "Iraq", "I"),
  buildWorldCupTeam("NOR", "NOR", "Norway", "Norway", "I"),
  buildWorldCupTeam("ARG", "ARG", "Argentina", "Argentina", "J"),
  buildWorldCupTeam("ALG", "ALG", "Algeria", "Algeria", "J"),
  buildWorldCupTeam("AUT", "AUT", "Austria", "Austria", "J"),
  buildWorldCupTeam("JOR", "JOR", "Jordan", "Jordan", "J"),
  buildWorldCupTeam("POR", "POR", "Portugal", "Portugal", "K"),
  buildWorldCupTeam("COD", "COD", "DR Congo", "DR Congo", "K"),
  buildWorldCupTeam("UZB", "UZB", "Uzbekistan", "Uzbekistan", "K"),
  buildWorldCupTeam("COL", "COL", "Colombia", "Colombia", "K"),
  buildWorldCupTeam("ENG", "ENG", "England", "England", "L"),
  buildWorldCupTeam("CRO", "CRO", "Croatia", "Croatia", "L"),
  buildWorldCupTeam("GHA", "GHA", "Ghana", "Ghana", "L"),
  buildWorldCupTeam("PAN", "PAN", "Panama", "Panama", "L")
] as const;

export const WORLD_CUP_2026_GROUPS: readonly WorldCup2026Group[] = [
  { groupId: "A", name: "A", teamIds: ["MEX", "RSA", "KOR", "CZE"], isClosed: false },
  { groupId: "B", name: "B", teamIds: ["CAN", "BIH", "QAT", "SUI"], isClosed: false },
  { groupId: "C", name: "C", teamIds: ["BRA", "MAR", "HAI", "SCO"], isClosed: false },
  { groupId: "D", name: "D", teamIds: ["USA", "PAR", "AUS", "TUR"], isClosed: false },
  { groupId: "E", name: "E", teamIds: ["GER", "CUW", "CIV", "ECU"], isClosed: false },
  { groupId: "F", name: "F", teamIds: ["NED", "JPN", "SWE", "TUN"], isClosed: false },
  { groupId: "G", name: "G", teamIds: ["BEL", "EGY", "IRN", "NZL"], isClosed: false },
  { groupId: "H", name: "H", teamIds: ["ESP", "CPV", "KSA", "URU"], isClosed: false },
  { groupId: "I", name: "I", teamIds: ["FRA", "SEN", "IRQ", "NOR"], isClosed: false },
  { groupId: "J", name: "J", teamIds: ["ARG", "ALG", "AUT", "JOR"], isClosed: false },
  { groupId: "K", name: "K", teamIds: ["POR", "COD", "UZB", "COL"], isClosed: false },
  { groupId: "L", name: "L", teamIds: ["ENG", "CRO", "GHA", "PAN"], isClosed: false }
] as const;
import { getTeamIdentityByFifaCode } from "@prode/shared";
