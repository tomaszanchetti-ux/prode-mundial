import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { tuMundialService }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../services/tu-mundial-service")
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

test("GET /api/v1/me/tournament returns projected groups for the authenticated user", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(tuMundialService, "getTuMundialForUser", async (userId: string) => {
    assert.equal(userId, "usr_1");

    return {
      mode: "pre_tournament",
      updatedAt: "2026-06-01T12:00:00.000Z",
      groups: [
        {
          groupId: "A",
          groupName: "Grupo A",
          completedMatches: 2,
          totalMatches: 6,
          isComplete: false,
          items: [
            {
              teamId: "MEX",
              teamName: "Mexico",
              flagUrl: null,
              played: 2,
              won: 2,
              drawn: 0,
              lost: 0,
              goalsFor: 4,
              goalsAgainst: 1,
              goalDifference: 3,
              points: 6,
              position: 1,
              isProjectedQualified: true
            }
          ]
        }
      ]
    };
  });

  try {
    const response = await fetch(buildUrl("/api/v1/me/tournament"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        groups: Array<{ groupId: string }>;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.groups[0]?.groupId, "A");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});
