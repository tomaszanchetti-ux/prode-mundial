import assert from "node:assert/strict";
import test from "node:test";
import type { GlobalStandingEntry } from "@prode/shared";
import { filterGlobalStandingsByName, formatGlobalLeagueNames } from "./leagues-helpers";

const sampleItems: GlobalStandingEntry[] = [
  {
    position: 1,
    userId: "u_1",
    displayName: "Ana García",
    leagueNames: ["Liga Alpha"],
    totalPoints: 20,
    exactHits: 2,
    correctSigns: 6,
    macroPoints: 0,
    isMe: false,
    isOwner: false
  },
  {
    position: 2,
    userId: "u_2",
    displayName: "Tomas",
    leagueNames: ["Liga Alpha", "Liga Beta"],
    totalPoints: 14,
    exactHits: 1,
    correctSigns: 5,
    macroPoints: 2,
    isMe: true,
    isOwner: false
  }
];

test("filterGlobalStandingsByName matches display names case-insensitively", () => {
  assert.deepEqual(filterGlobalStandingsByName(sampleItems, "gar").map((item) => item.userId), ["u_1"]);
  assert.deepEqual(filterGlobalStandingsByName(sampleItems, "TOMAS").map((item) => item.userId), ["u_2"]);
  assert.deepEqual(filterGlobalStandingsByName(sampleItems, ""), sampleItems);
});

test("formatGlobalLeagueNames joins multiple leagues", () => {
  assert.equal(formatGlobalLeagueNames(["Liga Alpha"]), "Liga Alpha");
  assert.equal(formatGlobalLeagueNames(["Liga Alpha", "Liga Beta"]), "Liga Alpha · Liga Beta");
});
