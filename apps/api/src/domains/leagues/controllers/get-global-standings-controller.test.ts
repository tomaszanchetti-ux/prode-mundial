import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [
  { createApp },
  { firebaseAdminAuth },
  { leagueMembersRepository },
  { leaguesRepository },
  { usersRepository }
] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../repositories/league-members-repository"),
  import("../repositories/leagues-repository"),
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

test("GET /api/v1/standings/global returns platform standings for active league members", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const activeLeaguesMock = mock.method(leaguesRepository, "listActiveLeagues", async () => [
    {
      leagueId: "lg_1",
      name: "Liga Demo",
      ownerUserId: "usr_1",
      memberLimit: 20,
      inviteCode: "DEMO26",
      inviteToken: "demo-token",
      inviteLink: "http://localhost:3000/leagues/join?token=demo",
      isActive: true,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z"
    },
    {
      leagueId: "lg_2",
      name: "Liga Cerrada",
      ownerUserId: "usr_3",
      memberLimit: 20,
      inviteCode: "OLD26",
      inviteToken: "old-token",
      inviteLink: null,
      isActive: true,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z"
    }
  ]);
  const membershipsMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async (leagueId: string) => {
    if (leagueId === "lg_1") {
      return [
        { membershipId: "mem_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
        { membershipId: "mem_2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-01T00:00:00Z" }
      ];
    }

    return [{ membershipId: "mem_3", leagueId: "lg_2", userId: "usr_3", role: "owner", joinedAt: "2026-01-01T00:00:00Z" }];
  });
  const profilesMock = mock.method(usersRepository, "listByUserIds", async (userIds: string[]) => {
    assert.deepEqual([...userIds].sort(), ["usr_1", "usr_2", "usr_3"]);
    return [
      {
        userId: "usr_1",
        displayName: "Tomas",
        totalPoints: 12,
        macroPoints: 0,
        exactHits: 1,
        correctSigns: 4
      },
      {
        userId: "usr_2",
        displayName: "Clara",
        totalPoints: 15,
        macroPoints: 0,
        exactHits: 1,
        correctSigns: 5
      },
      {
        userId: "usr_3",
        displayName: "Mateo",
        totalPoints: 10,
        macroPoints: 0,
        exactHits: 0,
        correctSigns: 3
      }
    ];
  });

  try {
    const response = await fetch(buildUrl("/api/v1/standings/global"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        participantsCount: number;
        items: Array<{ userId: string; position: number; isMe: boolean }>;
        myStanding: { position: number; totalPoints: number } | null;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.participantsCount, 3);
    assert.deepEqual(
      payload.data.items.map((item) => ({ userId: item.userId, position: item.position, isMe: item.isMe })),
      [
        { userId: "usr_2", position: 1, isMe: false },
        { userId: "usr_1", position: 2, isMe: true },
        { userId: "usr_3", position: 3, isMe: false }
      ]
    );
    assert.deepEqual(payload.data.myStanding, {
      position: 2,
      totalPoints: 12,
      exactHits: 1,
      correctSigns: 4,
      macroPoints: 0
    });
  } finally {
    verifyIdTokenMock.mock.restore();
    activeLeaguesMock.mock.restore();
    membershipsMock.mock.restore();
    profilesMock.mock.restore();
  }
});
