import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, mock, test } from "node:test";
import type { ConfirmMacroAdjustmentInput, SaveMacroPicksInput } from "@prode/shared";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const [{ createApp }, { firebaseAdminAuth }, { macroPicksService }] = await Promise.all([
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

test("GET /api/v1/macro-picks returns the authenticated macro picks state", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(macroPicksService, "getForUser", async (userId: string) => {
    assert.equal(userId, "usr_1");

    return {
      status: "draft_editable",
      isLocked: false,
      adjustmentAvailable: false,
      adjustmentAlreadyUsed: false,
      initialDeadlineAt: "2026-06-11T19:00:00Z",
      adjustmentWindow: {
        opensAt: "2026-06-26T19:00:00Z",
        closesAt: "2026-06-28T19:00:00Z"
      },
      groupPicks: {},
      finalists: [],
      champion: null,
      completion: {
        groupsCompleted: 0,
        groupsTotal: 12,
        hasFinalists: false,
        hasChampion: false,
        percent: 0
      }
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
    assert.equal(payload.data.status, "draft_editable");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});

test("PUT /api/v1/macro-picks saves the authenticated user picks", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(macroPicksService, "saveForUser", async (userId: string, input: SaveMacroPicksInput) => {
    assert.equal(userId, "usr_1");
    assert.deepEqual(input.groupPicks.A, {
      firstTeamId: "ARG",
      secondTeamId: "MEX"
    });

    return {
      status: "draft_editable",
      savedAt: "2026-06-01T12:00:00Z",
      completionPercent: 7
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
        groupPicks: {
          A: {
            firstTeamId: "ARG",
            secondTeamId: "MEX"
          }
        },
        finalists: [],
        champion: null
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        completionPercent: number;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.completionPercent, 7);
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});

test("POST /api/v1/macro-picks/adjustment confirms the authenticated adjustment", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(
    macroPicksService,
    "confirmAdjustmentForUser",
    async (userId: string, input: ConfirmMacroAdjustmentInput) => {
    assert.equal(userId, "usr_1");
    assert.deepEqual(input.finalists, ["ARG", "ESP"]);
    assert.equal(input.champion, "ARG");

    return {
      status: "adjusted_locked",
      adjustmentConfirmedAt: "2026-06-27T12:00:00Z",
      adjustedFinalists: ["ARG", "ESP"],
      adjustedChampion: "ARG",
      penaltyModel: {
        finalistPoints: 5,
        championPoints: 12
      }
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
        finalists: ["ARG", "ESP"],
        champion: "ARG"
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
    assert.equal(payload.data.status, "adjusted_locked");
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});
