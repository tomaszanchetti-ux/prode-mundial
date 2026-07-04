import assert from "node:assert/strict";
import test from "node:test";

const { buildGlobalStandingRows, collectUserLeagueNames } = await import("./global-standings-builder");

test("buildGlobalStandingRows orders users by points and tiebreakers", () => {
  const rows = buildGlobalStandingRows(
    [
      {
        userId: "usr_1",
        displayName: "Tomas",
        leagueNames: ["Liga Demo"],
        totalPoints: 12,
        exactHits: 2,
        correctSigns: 4,
        macroPoints: 0
      },
      {
        userId: "usr_2",
        displayName: "Clara",
        leagueNames: ["Liga Demo"],
        totalPoints: 15,
        exactHits: 1,
        correctSigns: 5,
        macroPoints: 0
      },
      {
        userId: "usr_3",
        displayName: "Mateo",
        leagueNames: ["Liga Norte"],
        totalPoints: 12,
        exactHits: 3,
        correctSigns: 2,
        macroPoints: 0
      }
    ],
    "usr_1"
  );

  assert.deepEqual(
    rows.map((row) => ({
      userId: row.userId,
      position: row.position,
      leagueNames: row.leagueNames,
      isMe: row.isMe,
      isOwner: row.isOwner
    })),
    [
      { userId: "usr_2", position: 1, leagueNames: ["Liga Demo"], isMe: false, isOwner: false },
      { userId: "usr_3", position: 2, leagueNames: ["Liga Norte"], isMe: false, isOwner: false },
      { userId: "usr_1", position: 3, leagueNames: ["Liga Demo"], isMe: true, isOwner: false }
    ]
  );
});

test("collectUserLeagueNames deduplicates and sorts league names per user", () => {
  const userLeagueNames = collectUserLeagueNames(
    [
      { leagueId: "lg_1", name: "Liga Zeta" },
      { leagueId: "lg_2", name: "Liga Alpha" }
    ],
    [
      [
        { userId: "usr_1" },
        { userId: "usr_2" }
      ],
      [{ userId: "usr_1" }]
    ]
  );

  assert.deepEqual(userLeagueNames.get("usr_1"), ["Liga Alpha", "Liga Zeta"]);
  assert.deepEqual(userLeagueNames.get("usr_2"), ["Liga Zeta"]);
});
