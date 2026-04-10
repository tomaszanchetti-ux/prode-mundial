export const APP_ROUTES = {
  landing: "/",
  login: "/login",
  home: "/home",
  tournament: "/tournament",
  matches: "/matches",
  rankings: "/rankings",
  leagues: "/leagues",
  profile: "/profile",
  rules: "/rules",
  terms: "/terms",
  privacy: "/privacy"
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
