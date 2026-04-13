import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const [{ createApp }, { leaguesRepository }, { leagueMembersRepository }] = await Promise.all([
  import("../../../server/app"),
  import("../repositories/leagues-repository"),
  import("../repositories/league-members-repository")
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

test("GET /api/v1/public/leagues/invite/:inviteToken returns league preview", async () => {
  const findLeagueByInviteTokenMock = mock.method(leaguesRepository, "findLeagueByInviteToken", async (inviteToken: string) => {
    assert.equal(inviteToken, "invite-token-123");
    return {
      leagueId: "lg_1",
      name: "Liga Demo",
      ownerUserId: "usr_1",
      memberLimit: 20,
      inviteCode: "DEMO26",
      inviteToken: "invite-token-123",
      inviteLink: "http://localhost:3000/leagues/join?token=invite-token-123",
      isActive: true,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z"
    };
  });
  const listMembershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lg_1__usr_1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "lg_1__usr_2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-02T00:00:00Z" }
  ]);

  try {
    const response = await fetch(buildUrl("/api/v1/public/leagues/invite/invite-token-123"));
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        leagueId: string;
        membersCount: number;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.leagueId, "lg_1");
    assert.equal(payload.data.membersCount, 2);
  } finally {
    findLeagueByInviteTokenMock.mock.restore();
    listMembershipsByLeagueMock.mock.restore();
  }
});
