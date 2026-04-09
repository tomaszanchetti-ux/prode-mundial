import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { leagueMembersRepository }, { leaguesRepository }, { leagueStandingsRepository }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../repositories/league-members-repository"),
  import("../repositories/leagues-repository"),
  import("../repositories/league-standings-repository")
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

test("GET /api/v1/leagues returns the authenticated league summaries", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const membershipsMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async (userId: string) => {
    assert.equal(userId, "usr_1");
    return [{ membershipId: "mem_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" }];
  });
  const leaguesMock = mock.method(leaguesRepository, "listLeaguesByIds", async (leagueIds: string[]) => {
    assert.deepEqual(leagueIds, ["lg_1"]);
    return [
      {
        leagueId: "lg_1",
        name: "Liga Demo",
        ownerUserId: "usr_1",
        memberLimit: 20,
        membersCount: 4,
        inviteCode: "DEMO26",
        inviteToken: "demo-token",
        inviteLink: "http://localhost:3000/leagues/join?token=demo",
        isActive: true,
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z"
      }
    ];
  });
  const membersCountMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "mem_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "mem_2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-01T00:00:00Z" }
  ]);
  const standingMock = mock.method(leagueStandingsRepository, "getStanding", async () => ({
    leagueId: "lg_1",
    userId: "usr_1",
    displayName: "Tomas",
    totalPoints: 12,
    macroPoints: 0,
    exactHits: 1,
    correctSigns: 4,
    position: 2,
    isOwner: true,
    lastUpdatedAt: "2026-01-01T00:00:00Z",
    lastPointArrivalAt: null
  }));

  try {
    const response = await fetch(buildUrl("/api/v1/leagues"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        items: Array<{ leagueId: string }>;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.deepEqual(payload.data.items.map((item) => item.leagueId), ["lg_1"]);
  } finally {
    verifyIdTokenMock.mock.restore();
    membershipsMock.mock.restore();
    leaguesMock.mock.restore();
    membersCountMock.mock.restore();
    standingMock.mock.restore();
  }
});
