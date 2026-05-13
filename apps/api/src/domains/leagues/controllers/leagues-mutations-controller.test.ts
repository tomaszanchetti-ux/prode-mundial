import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [
  { createApp },
  { firebaseAdminAuth },
  { leaguesRepository },
  { leagueMembersRepository },
  { leagueStandingsRepository },
  { usersRepository }
] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../repositories/leagues-repository"),
  import("../repositories/league-members-repository"),
  import("../repositories/league-standings-repository"),
  import("../../users/repositories/users-repository")
]);

const app = createApp();
const server = app.listen(0);

before(() => {
  server.unref();
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

function buildUrl(pathname: string) {
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}${pathname}`;
}

test("POST /api/v1/leagues creates a league for the authenticated user", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const findInviteCodeMock = mock.method(leaguesRepository, "findLeagueByInviteCode", async () => null);
  const findInviteTokenMock = mock.method(leaguesRepository, "findLeagueByInviteToken", async () => null);
  const upsertLeagueMock = mock.method(leaguesRepository, "upsertLeague", async () => undefined);
  const upsertMembershipMock = mock.method(leagueMembersRepository, "upsertMembership", async () => undefined);
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_1__usr_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" }
  ]);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => []);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "usr_1",
    displayName: "Tomas",
    email: "tomas@example.com",
    country: "AR",
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true,
    plan: "free",
    goldUpgradedAt: null
  }));
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lg_1__usr_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" }
  ]);
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues"), {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Liga del Asado" })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        name: string;
        membershipRole: string;
        inviteCode: string;
      };
    };

    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.name, "Liga del Asado");
    assert.equal(payload.data.membershipRole, "owner");
    assert.match(payload.data.inviteCode, /^[A-Z0-9]+$/);
    assert.equal(upsertLeagueMock.mock.callCount(), 1);
    assert.equal(upsertMembershipMock.mock.callCount(), 1);
    assert.equal(replaceStandingsMock.mock.callCount(), 1);
    assert.equal(upsertProfileMock.mock.callCount(), 1);
  } finally {
    verifyIdTokenMock.mock.restore();
    findInviteCodeMock.mock.restore();
    findInviteTokenMock.mock.restore();
    upsertLeagueMock.mock.restore();
    upsertMembershipMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    listByUserIdsMock.mock.restore();
    replaceStandingsMock.mock.restore();
    findProfileMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    upsertProfileMock.mock.restore();
  }
});

test("POST /api/v1/leagues/join joins an active league by invite code", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_2",
    email: "clara@example.com",
    name: "Clara"
  }));
  const findLeagueByInviteCodeMock = mock.method(leaguesRepository, "findLeagueByInviteCode", async (inviteCode: string) => {
    assert.equal(inviteCode, "ASADO26");
    return {
      leagueId: "lg_1",
      name: "Liga del Asado",
      ownerUserId: "usr_1",
      memberLimit: 20,
      inviteCode: "ASADO26",
      inviteToken: "invite-token",
      inviteLink: "http://localhost:3000/leagues/join?token=invite-token",
      isActive: true,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z"
    };
  });
  const findMembershipMock = mock.method(leagueMembersRepository, "findMembership", async () => null);
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_1__usr_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "lg_1__usr_2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);
  const upsertMembershipMock = mock.method(leagueMembersRepository, "upsertMembership", async () => undefined);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => []);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);
  const getStandingMock = mock.method(leagueStandingsRepository, "getStanding", async () => ({
    leagueId: "lg_1",
    userId: "usr_2",
    displayName: "Clara",
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    position: 2,
    isOwner: false,
    lastUpdatedAt: "2026-01-02T00:00:00Z",
    lastPointArrivalAt: null
  }));
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "usr_2",
    displayName: "Clara",
    email: "clara@example.com",
    country: "AR",
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true,
    plan: "free",
    goldUpgradedAt: null
  }));
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lg_1__usr_2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/join"), {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteCode: "asado26" })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        leagueId: string;
        membershipRole: string;
      };
    };

    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.leagueId, "lg_1");
    assert.equal(payload.data.membershipRole, "member");
    assert.equal(upsertMembershipMock.mock.callCount(), 1);
    assert.equal(replaceStandingsMock.mock.callCount(), 1);
    assert.equal(upsertProfileMock.mock.callCount(), 1);
  } finally {
    verifyIdTokenMock.mock.restore();
    findLeagueByInviteCodeMock.mock.restore();
    findMembershipMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    upsertMembershipMock.mock.restore();
    listByUserIdsMock.mock.restore();
    replaceStandingsMock.mock.restore();
    getStandingMock.mock.restore();
    findProfileMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    upsertProfileMock.mock.restore();
  }
});

test("POST /api/v1/leagues/join joins an active league by invite token", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_3",
    email: "mateo@example.com",
    name: "Mateo"
  }));
  const findLeagueByInviteTokenMock = mock.method(leaguesRepository, "findLeagueByInviteToken", async (inviteToken: string) => {
    assert.equal(inviteToken, "invite-token-123");
    return {
      leagueId: "lg_2",
      name: "Liga Token",
      ownerUserId: "usr_1",
      memberLimit: 20,
      inviteCode: "TOKEN26",
      inviteToken: "invite-token-123",
      inviteLink: "http://localhost:3000/leagues/join?token=invite-token-123",
      isActive: true,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z"
    };
  });
  const findMembershipMock = mock.method(leagueMembersRepository, "findMembership", async () => null);
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_2__usr_1", leagueId: "lg_2", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "lg_2__usr_3", leagueId: "lg_2", userId: "usr_3", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);
  const upsertMembershipMock = mock.method(leagueMembersRepository, "upsertMembership", async () => undefined);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => []);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);
  const getStandingMock = mock.method(leagueStandingsRepository, "getStanding", async () => ({
    leagueId: "lg_2",
    userId: "usr_3",
    displayName: "Mateo",
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    position: 2,
    isOwner: false,
    lastUpdatedAt: "2026-01-02T00:00:00Z",
    lastPointArrivalAt: null
  }));
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "usr_3",
    displayName: "Mateo",
    email: "mateo@example.com",
    country: "UY",
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true,
    plan: "free",
    goldUpgradedAt: null
  }));
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lg_2__usr_3", leagueId: "lg_2", userId: "usr_3", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/join"), {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteToken: "invite-token-123" })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        leagueId: string;
      };
    };

    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.leagueId, "lg_2");
  } finally {
    verifyIdTokenMock.mock.restore();
    findLeagueByInviteTokenMock.mock.restore();
    findMembershipMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    upsertMembershipMock.mock.restore();
    listByUserIdsMock.mock.restore();
    replaceStandingsMock.mock.restore();
    getStandingMock.mock.restore();
    findProfileMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    upsertProfileMock.mock.restore();
  }
});

test("POST /api/v1/leagues/join returns ALREADY_LEAGUE_MEMBER when the user is already inside", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_2",
    email: "clara@example.com",
    name: "Clara"
  }));
  const findLeagueByInviteCodeMock = mock.method(leaguesRepository, "findLeagueByInviteCode", async () => ({
    leagueId: "lg_1",
    name: "Liga del Asado",
    ownerUserId: "usr_1",
    memberLimit: 20,
    inviteCode: "ASADO26",
    inviteToken: "invite-token",
    inviteLink: "http://localhost:3000/leagues/join?token=invite-token",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  }));
  const findMembershipMock = mock.method(leagueMembersRepository, "findMembership", async () => ({
    membershipId: "lg_1__usr_2",
    leagueId: "lg_1",
    userId: "usr_2",
    role: "member",
    joinedAt: "2026-01-02T00:00:00Z"
  }));
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => []);
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lg_1__usr_2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => null);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/join"), {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteCode: "ASADO26" })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
      };
    };

    assert.equal(response.status, 409);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "ALREADY_LEAGUE_MEMBER");
  } finally {
    verifyIdTokenMock.mock.restore();
    findLeagueByInviteCodeMock.mock.restore();
    findMembershipMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    findProfileMock.mock.restore();
  }
});

test("POST /api/v1/leagues blocks creation when user already has MAX_LEAGUES_PER_USER", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_full",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lg_a__usr_full", leagueId: "lg_a", userId: "usr_full", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "lg_b__usr_full", leagueId: "lg_b", userId: "usr_full", role: "member", joinedAt: "2026-01-02T00:00:00Z" },
    { membershipId: "lg_c__usr_full", leagueId: "lg_c", userId: "usr_full", role: "member", joinedAt: "2026-01-03T00:00:00Z" }
  ]);
  const upsertLeagueMock = mock.method(leaguesRepository, "upsertLeague", async () => undefined);
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => null);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues"), {
      method: "POST",
      headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Cuarta Liga" })
    });
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    assert.equal(response.status, 409);
    assert.equal(payload.error.code, "USER_LEAGUE_LIMIT_REACHED");
    assert.equal(upsertLeagueMock.mock.callCount(), 0);
  } finally {
    verifyIdTokenMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    upsertLeagueMock.mock.restore();
    findProfileMock.mock.restore();
  }
});

test("POST /api/v1/leagues/join blocks join when user already has MAX_LEAGUES_PER_USER", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_full",
    email: "clara@example.com",
    name: "Clara"
  }));
  const findLeagueByInviteCodeMock = mock.method(leaguesRepository, "findLeagueByInviteCode", async () => ({
    leagueId: "lg_new",
    name: "Liga Nueva",
    ownerUserId: "usr_other",
    memberLimit: 20,
    inviteCode: "NEW26",
    inviteToken: "tok-new",
    inviteLink: "http://localhost:3000/leagues/join?token=tok-new",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  }));
  const findMembershipMock = mock.method(leagueMembersRepository, "findMembership", async () => null);
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_new__usr_other", leagueId: "lg_new", userId: "usr_other", role: "owner", joinedAt: "2026-01-01T00:00:00Z" }
  ]);
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lg_a__usr_full", leagueId: "lg_a", userId: "usr_full", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "lg_b__usr_full", leagueId: "lg_b", userId: "usr_full", role: "member", joinedAt: "2026-01-02T00:00:00Z" },
    { membershipId: "lg_c__usr_full", leagueId: "lg_c", userId: "usr_full", role: "member", joinedAt: "2026-01-03T00:00:00Z" }
  ]);
  const upsertMembershipMock = mock.method(leagueMembersRepository, "upsertMembership", async () => undefined);
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => null);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/join"), {
      method: "POST",
      headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: "NEW26" })
    });
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    assert.equal(response.status, 409);
    assert.equal(payload.error.code, "USER_LEAGUE_LIMIT_REACHED");
    assert.equal(upsertMembershipMock.mock.callCount(), 0);
  } finally {
    verifyIdTokenMock.mock.restore();
    findLeagueByInviteCodeMock.mock.restore();
    findMembershipMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    upsertMembershipMock.mock.restore();
    findProfileMock.mock.restore();
  }
});

test("DELETE /api/v1/leagues/:leagueId/membership lets a member leave the league", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_member",
    email: "clara@example.com",
    name: "Clara"
  }));
  const getLeagueByIdMock = mock.method(leaguesRepository, "getLeagueById", async () => ({
    leagueId: "lg_1",
    name: "Liga del Asado",
    ownerUserId: "usr_owner",
    memberLimit: 20,
    inviteCode: "ASADO26",
    inviteToken: "tok",
    inviteLink: "http://localhost:3000/leagues/join?token=tok",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  }));
  const findMembershipMock = mock.method(leagueMembersRepository, "findMembership", async () => ({
    membershipId: "lg_1__usr_member",
    leagueId: "lg_1",
    userId: "usr_member",
    role: "member",
    joinedAt: "2026-01-02T00:00:00Z"
  }));
  const deleteMembershipMock = mock.method(leagueMembersRepository, "deleteMembership", async () => undefined);
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_1__usr_owner", leagueId: "lg_1", userId: "usr_owner", role: "owner", joinedAt: "2026-01-01T00:00:00Z" }
  ]);
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => []);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => []);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "usr_member", displayName: "Clara", email: "clara@example.com", country: "ES", photoUrl: null,
    totalPoints: 0, macroPoints: 0, exactHits: 0, correctSigns: 0, leaguesCount: 1, profileCompleted: true, plan: "free", goldUpgradedAt: null
  }));
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/lg_1/membership"), {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" }
    });
    const payload = (await response.json()) as { ok: boolean; data: { left: boolean } };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.left, true);
    assert.equal(deleteMembershipMock.mock.callCount(), 1);
  } finally {
    verifyIdTokenMock.mock.restore();
    getLeagueByIdMock.mock.restore();
    findMembershipMock.mock.restore();
    deleteMembershipMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    listByUserIdsMock.mock.restore();
    replaceStandingsMock.mock.restore();
    findProfileMock.mock.restore();
    upsertProfileMock.mock.restore();
  }
});

test("DELETE /api/v1/leagues/:leagueId/membership refuses when user is the owner", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_owner",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const getLeagueByIdMock = mock.method(leaguesRepository, "getLeagueById", async () => ({
    leagueId: "lg_1",
    name: "Liga del Asado",
    ownerUserId: "usr_owner",
    memberLimit: 20,
    inviteCode: "ASADO26",
    inviteToken: "tok",
    inviteLink: "http://localhost:3000/leagues/join?token=tok",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  }));
  const findMembershipMock = mock.method(leagueMembersRepository, "findMembership", async () => ({
    membershipId: "lg_1__usr_owner",
    leagueId: "lg_1",
    userId: "usr_owner",
    role: "owner",
    joinedAt: "2026-01-01T00:00:00Z"
  }));
  const deleteMembershipMock = mock.method(leagueMembersRepository, "deleteMembership", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/lg_1/membership"), {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" }
    });
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    assert.equal(response.status, 409);
    assert.equal(payload.error.code, "LEAGUE_OWNER_CANNOT_LEAVE");
    assert.equal(deleteMembershipMock.mock.callCount(), 0);
  } finally {
    verifyIdTokenMock.mock.restore();
    getLeagueByIdMock.mock.restore();
    findMembershipMock.mock.restore();
    deleteMembershipMock.mock.restore();
  }
});

test("DELETE /api/v1/leagues/:leagueId lets the owner delete the league cascade", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_owner",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const getLeagueByIdMock = mock.method(leaguesRepository, "getLeagueById", async () => ({
    leagueId: "lg_1",
    name: "Liga del Asado",
    ownerUserId: "usr_owner",
    memberLimit: 20,
    inviteCode: "ASADO26",
    inviteToken: "tok",
    inviteLink: "http://localhost:3000/leagues/join?token=tok",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  }));
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_1__usr_owner", leagueId: "lg_1", userId: "usr_owner", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "lg_1__usr_member", leagueId: "lg_1", userId: "usr_member", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);
  const deleteMembershipsByLeagueMock = mock.method(leagueMembersRepository, "deleteMembershipsByLeague", async () => undefined);
  const deleteStandingsMock = mock.method(leagueStandingsRepository, "deleteStandings", async () => undefined);
  const deleteLeagueMock = mock.method(leaguesRepository, "deleteLeague", async () => undefined);
  const listMembershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => []);
  const findProfileMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "any", displayName: "Any", email: "any@example.com", country: null, photoUrl: null,
    totalPoints: 0, macroPoints: 0, exactHits: 0, correctSigns: 0, leaguesCount: 1, profileCompleted: true, plan: "free", goldUpgradedAt: null
  }));
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/lg_1"), {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" }
    });
    const payload = (await response.json()) as { ok: boolean; data: { deleted: boolean } };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.deleted, true);
    assert.equal(deleteMembershipsByLeagueMock.mock.callCount(), 1);
    assert.equal(deleteStandingsMock.mock.callCount(), 1);
    assert.equal(deleteLeagueMock.mock.callCount(), 1);
    assert.equal(upsertProfileMock.mock.callCount(), 2);
  } finally {
    verifyIdTokenMock.mock.restore();
    getLeagueByIdMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
    deleteMembershipsByLeagueMock.mock.restore();
    deleteStandingsMock.mock.restore();
    deleteLeagueMock.mock.restore();
    listMembershipsByUserMock.mock.restore();
    findProfileMock.mock.restore();
    upsertProfileMock.mock.restore();
  }
});

test("DELETE /api/v1/leagues/:leagueId refuses when caller is not the owner", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_member",
    email: "clara@example.com",
    name: "Clara"
  }));
  const getLeagueByIdMock = mock.method(leaguesRepository, "getLeagueById", async () => ({
    leagueId: "lg_1",
    name: "Liga del Asado",
    ownerUserId: "usr_owner",
    memberLimit: 20,
    inviteCode: "ASADO26",
    inviteToken: "tok",
    inviteLink: "http://localhost:3000/leagues/join?token=tok",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  }));
  const deleteLeagueMock = mock.method(leaguesRepository, "deleteLeague", async () => undefined);

  try {
    const response = await fetch(buildUrl("/api/v1/leagues/lg_1"), {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" }
    });
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    assert.equal(response.status, 403);
    assert.equal(payload.error.code, "LEAGUE_NOT_OWNER");
    assert.equal(deleteLeagueMock.mock.callCount(), 0);
  } finally {
    verifyIdTokenMock.mock.restore();
    getLeagueByIdMock.mock.restore();
    deleteLeagueMock.mock.restore();
  }
});
