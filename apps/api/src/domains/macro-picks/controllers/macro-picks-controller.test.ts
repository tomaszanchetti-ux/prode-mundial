import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, mock, test } from "node:test";
import type { SaveChampionPickInput, AdjustChampionInput } from "@prode/shared";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const [{ createApp }, { firebaseAdminAuth }, { championPickService }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../services/macro-picks-service")
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

test("GET /api/v1/macro-picks returns the authenticated champion pick state", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(championPickService, "getForUser", async (userId: string) => {
    assert.equal(userId, "usr_1");

    return {
      status: "empty",
      championTeamId: null,
      adjustedChampionTeamId: null,
      initialDeadlineAt: "2026-06-11T19:00:00Z",
      adjustmentWindowOpensAt: "2026-06-26T19:00:00Z",
      adjustmentWindowClosesAt: "2026-06-28T19:00:00Z",
      isLocked: false,
      isAdjustmentWindowOpen: false,
      scoringResult: null
    };
  });

  try {
    const response = await fetch(buildUrl("/api/v1/macro-picks"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        status: string;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.status, "empty");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});

test("PUT /api/v1/macro-picks saves the authenticated user champion pick", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(championPickService, "saveForUser", async (userId: string, input: SaveChampionPickInput) => {
    assert.equal(userId, "usr_1");
    assert.equal(input.championTeamId, "ARG");

    return {
      ok: true as const,
      status: "picked" as const
    };
  });

  try {
    const response = await fetch(buildUrl("/api/v1/macro-picks"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        championTeamId: "ARG"
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        status: string;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.status, "picked");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});

test("POST /api/v1/macro-picks/adjustment confirms the authenticated champion adjustment", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(
    championPickService,
    "adjustForUser",
    async (userId: string, input: AdjustChampionInput) => {
    assert.equal(userId, "usr_1");
    assert.equal(input.championTeamId, "ESP");

    return {
      ok: true as const,
      status: "adjusted" as const,
      penaltyNotice: "Si aciertas el campeon ajustado, sumas 10 pts en vez de 25."
    };
    }
  );

  try {
    const response = await fetch(buildUrl("/api/v1/macro-picks/adjustment"), {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        championTeamId: "ESP"
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        status: string;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.status, "adjusted");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});
