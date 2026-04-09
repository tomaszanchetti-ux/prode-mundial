import type { UserProfile } from "@prode/shared";

export const DEMO_LEAGUES = [
  {
    code: "madrid",
    leagueId: "demo_madrid",
    name: "Liga Demo Madrid",
    inviteCode: "MADRID26",
    inviteToken: "demo-token-madrid"
  },
  {
    code: "asado",
    leagueId: "demo_asado",
    name: "Liga Demo Asado",
    inviteCode: "ASADO26",
    inviteToken: "demo-token-asado"
  }
] as const;

export const DEMO_MATCH_IDS = ["demo_m_001", "demo_m_002"] as const;

export const DEMO_GUEST_USERS: UserProfile[] = [
  {
    userId: "usr_demo_guest_1",
    displayName: "Clara",
    email: "clara-demo@prode.local",
    country: "ES",
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true
  },
  {
    userId: "usr_demo_guest_2",
    displayName: "Mateo",
    email: "mateo-demo@prode.local",
    country: "UY",
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true
  },
  {
    userId: "usr_demo_guest_3",
    displayName: "Lu",
    email: "lu-demo@prode.local",
    country: "AR",
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true
  }
];

export const DEMO_ANCHOR_FALLBACK: UserProfile = {
  userId: "usr_demo_anchor",
  displayName: "Tomas Demo",
  email: "tomas-demo@prode.local",
  country: "AR",
  photoUrl: null,
  totalPoints: 0,
  macroPoints: 0,
  exactHits: 0,
  correctSigns: 0,
  leaguesCount: 0,
  profileCompleted: true
};

export function buildMembershipId(leagueId: string, userId: string) {
  return `${leagueId}__${userId}`;
}

export function buildInviteLink(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  return `${baseUrl}/leagues/join?token=${token}`;
}

export function isDemoUser(userId: string) {
  return userId === DEMO_ANCHOR_FALLBACK.userId || DEMO_GUEST_USERS.some((user) => user.userId === userId);
}

