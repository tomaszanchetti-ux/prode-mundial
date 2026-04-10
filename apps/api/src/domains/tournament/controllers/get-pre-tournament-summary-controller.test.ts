import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { preTournamentSummaryService }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../services/pre-tournament-summary-service")
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

test("GET /api/v1/me/pre-tournament returns the authenticated user summary", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(preTournamentSummaryService, "getSummaryForUser", async (userId: string) => {
    assert.equal(userId, "usr_1");

    return {
      isPreTournament: true,
      completedMatches: 12,
      totalMatches: 48,
      remainingMatches: 36,
      completionPercentage: 25,
      nextPendingMatchId: "m_013"
    };
  });

  try {
    const response = await fetch(buildUrl("/api/v1/me/pre-tournament"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        completionPercentage: number;
        nextPendingMatchId: string | null;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.completionPercentage, 25);
    assert.equal(payload.data.nextPendingMatchId, "m_013");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});
