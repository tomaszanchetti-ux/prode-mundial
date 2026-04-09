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
  name: string;
  shortName: string;
  flagUrl: string | null;
  groupId: string;
  isActive: boolean;
};

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
  { teamId: "MEX", fifaCode: "MEX", name: "Mexico", shortName: "Mexico", flagUrl: null, groupId: "A", isActive: true },
  { teamId: "RSA", fifaCode: "RSA", name: "South Africa", shortName: "South Africa", flagUrl: null, groupId: "A", isActive: true },
  { teamId: "KOR", fifaCode: "KOR", name: "Korea Republic", shortName: "Korea", flagUrl: null, groupId: "A", isActive: true },
  { teamId: "CZE", fifaCode: "CZE", name: "Czechia", shortName: "Czechia", flagUrl: null, groupId: "A", isActive: true },
  { teamId: "CAN", fifaCode: "CAN", name: "Canada", shortName: "Canada", flagUrl: null, groupId: "B", isActive: true },
  { teamId: "BIH", fifaCode: "BIH", name: "Bosnia and Herzegovina", shortName: "Bosnia", flagUrl: null, groupId: "B", isActive: true },
  { teamId: "QAT", fifaCode: "QAT", name: "Qatar", shortName: "Qatar", flagUrl: null, groupId: "B", isActive: true },
  { teamId: "SUI", fifaCode: "SUI", name: "Switzerland", shortName: "Switzerland", flagUrl: null, groupId: "B", isActive: true },
  { teamId: "BRA", fifaCode: "BRA", name: "Brazil", shortName: "Brazil", flagUrl: null, groupId: "C", isActive: true },
  { teamId: "MAR", fifaCode: "MAR", name: "Morocco", shortName: "Morocco", flagUrl: null, groupId: "C", isActive: true },
  { teamId: "HAI", fifaCode: "HAI", name: "Haiti", shortName: "Haiti", flagUrl: null, groupId: "C", isActive: true },
  { teamId: "SCO", fifaCode: "SCO", name: "Scotland", shortName: "Scotland", flagUrl: null, groupId: "C", isActive: true },
  { teamId: "USA", fifaCode: "USA", name: "United States", shortName: "USA", flagUrl: null, groupId: "D", isActive: true },
  { teamId: "PAR", fifaCode: "PAR", name: "Paraguay", shortName: "Paraguay", flagUrl: null, groupId: "D", isActive: true },
  { teamId: "AUS", fifaCode: "AUS", name: "Australia", shortName: "Australia", flagUrl: null, groupId: "D", isActive: true },
  { teamId: "TUR", fifaCode: "TUR", name: "Turkey", shortName: "Turkey", flagUrl: null, groupId: "D", isActive: true },
  { teamId: "GER", fifaCode: "GER", name: "Germany", shortName: "Germany", flagUrl: null, groupId: "E", isActive: true },
  { teamId: "CUW", fifaCode: "CUW", name: "Curacao", shortName: "Curacao", flagUrl: null, groupId: "E", isActive: true },
  { teamId: "CIV", fifaCode: "CIV", name: "Cote d'Ivoire", shortName: "Cote d'Ivoire", flagUrl: null, groupId: "E", isActive: true },
  { teamId: "ECU", fifaCode: "ECU", name: "Ecuador", shortName: "Ecuador", flagUrl: null, groupId: "E", isActive: true },
  { teamId: "NED", fifaCode: "NED", name: "Netherlands", shortName: "Netherlands", flagUrl: null, groupId: "F", isActive: true },
  { teamId: "JPN", fifaCode: "JPN", name: "Japan", shortName: "Japan", flagUrl: null, groupId: "F", isActive: true },
  { teamId: "SWE", fifaCode: "SWE", name: "Sweden", shortName: "Sweden", flagUrl: null, groupId: "F", isActive: true },
  { teamId: "TUN", fifaCode: "TUN", name: "Tunisia", shortName: "Tunisia", flagUrl: null, groupId: "F", isActive: true },
  { teamId: "BEL", fifaCode: "BEL", name: "Belgium", shortName: "Belgium", flagUrl: null, groupId: "G", isActive: true },
  { teamId: "EGY", fifaCode: "EGY", name: "Egypt", shortName: "Egypt", flagUrl: null, groupId: "G", isActive: true },
  { teamId: "IRN", fifaCode: "IRN", name: "IR Iran", shortName: "Iran", flagUrl: null, groupId: "G", isActive: true },
  { teamId: "NZL", fifaCode: "NZL", name: "New Zealand", shortName: "New Zealand", flagUrl: null, groupId: "G", isActive: true },
  { teamId: "ESP", fifaCode: "ESP", name: "Spain", shortName: "Spain", flagUrl: null, groupId: "H", isActive: true },
  { teamId: "CPV", fifaCode: "CPV", name: "Cape Verde", shortName: "Cape Verde", flagUrl: null, groupId: "H", isActive: true },
  { teamId: "KSA", fifaCode: "KSA", name: "Saudi Arabia", shortName: "Saudi Arabia", flagUrl: null, groupId: "H", isActive: true },
  { teamId: "URU", fifaCode: "URU", name: "Uruguay", shortName: "Uruguay", flagUrl: null, groupId: "H", isActive: true },
  { teamId: "FRA", fifaCode: "FRA", name: "France", shortName: "France", flagUrl: null, groupId: "I", isActive: true },
  { teamId: "SEN", fifaCode: "SEN", name: "Senegal", shortName: "Senegal", flagUrl: null, groupId: "I", isActive: true },
  { teamId: "IRQ", fifaCode: "IRQ", name: "Iraq", shortName: "Iraq", flagUrl: null, groupId: "I", isActive: true },
  { teamId: "NOR", fifaCode: "NOR", name: "Norway", shortName: "Norway", flagUrl: null, groupId: "I", isActive: true },
  { teamId: "ARG", fifaCode: "ARG", name: "Argentina", shortName: "Argentina", flagUrl: null, groupId: "J", isActive: true },
  { teamId: "ALG", fifaCode: "ALG", name: "Algeria", shortName: "Algeria", flagUrl: null, groupId: "J", isActive: true },
  { teamId: "AUT", fifaCode: "AUT", name: "Austria", shortName: "Austria", flagUrl: null, groupId: "J", isActive: true },
  { teamId: "JOR", fifaCode: "JOR", name: "Jordan", shortName: "Jordan", flagUrl: null, groupId: "J", isActive: true },
  { teamId: "POR", fifaCode: "POR", name: "Portugal", shortName: "Portugal", flagUrl: null, groupId: "K", isActive: true },
  { teamId: "COD", fifaCode: "COD", name: "DR Congo", shortName: "DR Congo", flagUrl: null, groupId: "K", isActive: true },
  { teamId: "UZB", fifaCode: "UZB", name: "Uzbekistan", shortName: "Uzbekistan", flagUrl: null, groupId: "K", isActive: true },
  { teamId: "COL", fifaCode: "COL", name: "Colombia", shortName: "Colombia", flagUrl: null, groupId: "K", isActive: true },
  { teamId: "ENG", fifaCode: "ENG", name: "England", shortName: "England", flagUrl: null, groupId: "L", isActive: true },
  { teamId: "CRO", fifaCode: "CRO", name: "Croatia", shortName: "Croatia", flagUrl: null, groupId: "L", isActive: true },
  { teamId: "GHA", fifaCode: "GHA", name: "Ghana", shortName: "Ghana", flagUrl: null, groupId: "L", isActive: true },
  { teamId: "PAN", fifaCode: "PAN", name: "Panama", shortName: "Panama", flagUrl: null, groupId: "L", isActive: true }
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
