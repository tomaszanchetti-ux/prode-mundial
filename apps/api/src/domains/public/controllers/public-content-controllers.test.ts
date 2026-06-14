import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { PublicMatch } from "@prode/shared";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { publicContentService }] = await Promise.all([
  import("../../../server/app"),
  import("../services/public-content-service")
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

function sampleMatch(overrides: Partial<PublicMatch> = {}): PublicMatch {
  return {
    matchId: "m_001",
    officialMatchNumber: 1,
    stage: "group",
    groupId: "A",
    homeTeam: { teamId: "t_arg", name: "Argentina", fifaCode: "ARG", iso2: "ar", iso3: "arg", flagAsset: null, flagUrl: null },
    awayTeam: { teamId: "t_bra", name: "Brasil", fifaCode: "BRA", iso2: "br", iso3: "bra", flagAsset: null, flagUrl: null },
    homeSlot: null,
    awaySlot: null,
    kickoffAt: "2026-06-11T19:00:00Z",
    status: "finished",
    homeScore90: 2,
    awayScore90: 1,
    winnerTeamId: "t_arg",
    ...overrides
  };
}

test("GET /api/v1/public/matches needs no auth and forwards validated query", async () => {
  const serviceMock = mock.method(
    publicContentService,
    "listMatches",
    async (query: { stage?: string; filter?: string }) => {
      assert.deepEqual(query, { stage: "group", filter: "finished" });
      return [sampleMatch()];
    }
  );

  try {
    const response = await fetch(buildUrl("/api/v1/public/matches?stage=group&filter=finished"));
    const payload = (await response.json()) as { ok: boolean; data: { items: PublicMatch[] } };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0]?.matchId, "m_001");
    // No user-scoped leakage in the public payload.
    assert.ok(!("predictionStatus" in payload.data.items[0]!));
    assert.ok(!("userPredictionSummary" in payload.data.items[0]!));
    assert.ok(!("ctaLabel" in payload.data.items[0]!));
    assert.match(response.headers.get("cache-control") ?? "", /max-age=60/);
  } finally {
    serviceMock.mock.restore();
  }
});

test("GET /api/v1/public/matches rejects user-only filters (e.g. pending)", async () => {
  const response = await fetch(buildUrl("/api/v1/public/matches?filter=pending"));
  const payload = (await response.json()) as { ok: boolean; error: { code: string } };

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("GET /api/v1/public/matches/:matchId returns the match", async () => {
  const serviceMock = mock.method(publicContentService, "getMatch", async (matchId: string) => {
    assert.equal(matchId, "m_042");
    return sampleMatch({ matchId: "m_042" });
  });

  try {
    const response = await fetch(buildUrl("/api/v1/public/matches/m_042"));
    const payload = (await response.json()) as { ok: boolean; data: PublicMatch };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.matchId, "m_042");
  } finally {
    serviceMock.mock.restore();
  }
});

test("GET /api/v1/public/matches/:matchId returns 404 for unknown match", async () => {
  const serviceMock = mock.method(publicContentService, "getMatch", async () => null);

  try {
    const response = await fetch(buildUrl("/api/v1/public/matches/nope"));
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    assert.equal(response.status, 404);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "MATCH_NOT_FOUND");
  } finally {
    serviceMock.mock.restore();
  }
});

test("GET /api/v1/public/standings returns full group tables", async () => {
  const serviceMock = mock.method(publicContentService, "getStandings", async () => [
    {
      groupId: "A",
      rows: [
        {
          position: 1,
          teamId: "t_arg",
          teamName: "Argentina",
          played: 1,
          won: 1,
          drawn: 0,
          lost: 0,
          goalsFor: 2,
          goalsAgainst: 1,
          goalDifference: 1,
          points: 3
        }
      ]
    }
  ]);

  try {
    const response = await fetch(buildUrl("/api/v1/public/standings"));
    const payload = (await response.json()) as {
      ok: boolean;
      data: { groups: Array<{ groupId: string; rows: Array<{ teamName: string; points: number }> }> };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.groups[0]?.groupId, "A");
    assert.equal(payload.data.groups[0]?.rows[0]?.points, 3);
  } finally {
    serviceMock.mock.restore();
  }
});

test("GET /api/v1/public/teams returns the team directory", async () => {
  const serviceMock = mock.method(publicContentService, "listTeams", async () => [
    { teamId: "t_arg", fifaCode: "ARG", iso2: "ar", name: "Argentina", shortName: "ARG", flagUrl: null, groupId: "A" }
  ]);

  try {
    const response = await fetch(buildUrl("/api/v1/public/teams"));
    const payload = (await response.json()) as { ok: boolean; data: { items: Array<{ fifaCode: string }> } };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.items[0]?.fifaCode, "ARG");
  } finally {
    serviceMock.mock.restore();
  }
});
