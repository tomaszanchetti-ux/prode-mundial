import assert from "node:assert/strict";
import test from "node:test";
import type { StoredLeagueMember } from "../types";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const { buildLeagueStandingRows } = await import("./league-standings-builder");

test("buildLeagueStandingRows orders standings by points, exact hits and correct signs", () => {
  const memberships: StoredLeagueMember[] = [
    { membershipId: "m1", leagueId: "lg_1", userId: "usr_1", role: "owner", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "m2", leagueId: "lg_1", userId: "usr_2", role: "member", joinedAt: "2026-01-01T00:00:00Z" },
    { membershipId: "m3", leagueId: "lg_1", userId: "usr_3", role: "member", joinedAt: "2026-01-01T00:00:00Z" }
  ];

  const rows = buildLeagueStandingRows(
    "lg_1",
    memberships,
    [
      { userId: "usr_1", displayName: "Tomas", totalPoints: 12, exactHits: 2, correctSigns: 4, macroPoints: 0 },
      { userId: "usr_2", displayName: "Clara", totalPoints: 15, exactHits: 1, correctSigns: 5, macroPoints: 0 },
      { userId: "usr_3", displayName: "Mateo", totalPoints: 12, exactHits: 3, correctSigns: 2, macroPoints: 0 }
    ],
    "2026-01-02T00:00:00Z"
  );

  assert.deepEqual(
    rows.map((row) => ({ userId: row.userId, position: row.position })),
    [
      { userId: "usr_2", position: 1 },
      { userId: "usr_3", position: 2 },
      { userId: "usr_1", position: 3 }
    ]
  );
  assert.equal(rows[2]?.isOwner, true);
});
