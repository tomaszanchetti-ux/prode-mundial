import assert from "node:assert/strict";
import test from "node:test";

const { buildGlobalStandingRows } = await import("./global-standings-builder");

test("buildGlobalStandingRows orders users by points and tiebreakers", () => {
  const rows = buildGlobalStandingRows(
    [
      { userId: "usr_1", displayName: "Tomas", totalPoints: 12, exactHits: 2, correctSigns: 4, macroPoints: 0 },
      { userId: "usr_2", displayName: "Clara", totalPoints: 15, exactHits: 1, correctSigns: 5, macroPoints: 0 },
      { userId: "usr_3", displayName: "Mateo", totalPoints: 12, exactHits: 3, correctSigns: 2, macroPoints: 0 }
    ],
    "usr_1"
  );

  assert.deepEqual(
    rows.map((row) => ({ userId: row.userId, position: row.position, isMe: row.isMe, isOwner: row.isOwner })),
    [
      { userId: "usr_2", position: 1, isMe: false, isOwner: false },
      { userId: "usr_3", position: 2, isMe: false, isOwner: false },
      { userId: "usr_1", position: 3, isMe: true, isOwner: false }
    ]
  );
});
