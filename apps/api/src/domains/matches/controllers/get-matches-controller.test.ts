import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { ListMatchesQuery } from "@prode/shared";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { matchesQueryService }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../services/matches-query-service")
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

test("GET /api/v1/matches returns envelope with validated query forwarded to service", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(matchesQueryService, "listMatchesForUser", async (userId: string, query: ListMatchesQuery) => {
    assert.equal(userId, "usr_1");
    assert.deepEqual(query, {
      stage: "R32",
      filter: "pending",
      cursor: "2026-06-11T19:00:00Z::m_001",
      limit: 5
    });

    return {
      items: [
        {
          matchId: "m_073",
          stage: "R32",
          groupId: null,
          homeTeam: { teamId: "slot:2A", name: "Por definir (2A)", flagUrl: null },
          awayTeam: { teamId: "slot:2B", name: "Por definir (2B)", flagUrl: null },
          kickoffAt: "2026-06-27T19:00:00Z",
          status: "scheduled",
          deadlineAt: "2026-06-27T19:00:00Z",
          isLocked: false,
          predictionStatus: "empty",
          userPredictionSummary: null,
          isEditable: true,
          ctaLabel: "Predecir"
        }
      ],
      nextCursor: null
    };
  });

  try {
    const response = await fetch(
      buildUrl("/api/v1/matches?stage=R32&filter=pending&cursor=2026-06-11T19:00:00Z::m_001&limit=5"),
      {
        headers: {
          Authorization: "Bearer valid-token"
        }
      }
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        items: Array<{ matchId: string }>;
        nextCursor: string | null;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.deepEqual(payload.data.items.map((item) => item.matchId), ["m_073"]);
    assert.equal(payload.data.nextCursor, null);
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});

test("GET /api/v1/matches rejects invalid query params", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));

  try {
    const response = await fetch(buildUrl("/api/v1/matches?limit=abc"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
        details: {
          issues: Array<{ path: string; message: string }>;
        };
      };
    };

    assert.equal(response.status, 400);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "VALIDATION_ERROR");
    assert.equal(payload.error.details.issues[0]?.path, "limit");
  } finally {
    verifyIdTokenMock.mock.restore();
  }
});
