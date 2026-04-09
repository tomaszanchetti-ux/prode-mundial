#!/usr/bin/env python3

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


RAW_PATH = Path(
    "/Users/tzanchetti/Documents/Proyectos Claudio/prode-mundial/apps/api/src/domains/matches/data/world-cup-2026-raw-schedule.json"
)
OUTPUT_PATH = Path(
    "/Users/tzanchetti/Documents/Proyectos Claudio/prode-mundial/apps/api/src/domains/matches/data/world-cup-2026-normalized-matches.json"
)

ET_ZONE = ZoneInfo("America/New_York")

SPANISH_MONTHS = {
    "junio": 6,
    "julio": 7,
}


def parse_date_label(label: str) -> tuple[int, int, int]:
    day_raw, _, month_name = label.partition(" de ")
    return 2026, SPANISH_MONTHS[month_name], int(day_raw)


def parse_stage(match_number: int) -> str:
    if match_number <= 72:
        return "group"
    if match_number <= 88:
        return "R32"
    if match_number <= 96:
        return "R16"
    if match_number <= 100:
        return "QF"
    if match_number <= 102:
        return "SF"
    if match_number == 103:
        return "BRONZE"
    return "FINAL"


def normalize_slot_tokens(tokens: list[str]) -> tuple[str | None, str | None]:
    if not tokens:
        return None, None

    if "v" in tokens:
        split_index = tokens.index("v")
        home_tokens = tokens[:split_index]
        away_tokens = tokens[split_index + 1 :]
    else:
        return None, None

    def compact(parts: list[str]) -> str | None:
        if not parts:
            return None
        value = "".join(parts)
        return value or None

    return compact(home_tokens), compact(away_tokens)


def choose_best_sighting(sightings: list[dict[str, object]]) -> dict[str, object]:
    return max(
        sightings,
        key=lambda sighting: (
            len(sighting["tokens"]),
            1 if "v" in sighting["tokens"] else 0,
        ),
    )


def derive_group_from_tokens(tokens: list[str]) -> str | None:
    if not tokens:
        return None
    last = tokens[-1]
    if len(last) == 1 and last.isalpha():
        return last
    return None


def strip_group_marker(tokens: list[str], group_id: str | None) -> list[str]:
    if group_id is None or not tokens:
        return tokens
    if tokens[-1] == group_id:
        return tokens[:-1]
    return tokens


def normalize_match(row: dict[str, object]) -> dict[str, object]:
    official_match_number = row["officialMatchNumber"]
    sighting = choose_best_sighting(row["sightings"])
    date_label = sighting["dateLabel"]
    time_et = sighting["timeEt"]
    venue_id = sighting["venueId"]
    tokens = sighting["tokens"]
    stage = parse_stage(official_match_number)

    year, month, day = parse_date_label(date_label)
    hour, minute = [int(value) for value in time_et.split(":")]
    kickoff_et_dt = datetime(year, month, day, hour, minute, tzinfo=ET_ZONE)
    kickoff_et = kickoff_et_dt.isoformat()
    kickoff_utc = kickoff_et_dt.astimezone(ZoneInfo("UTC")).isoformat().replace("+00:00", "Z")

    group_id = None
    home_team_id = None
    away_team_id = None
    home_slot = None
    away_slot = None

    if stage == "group":
        group_id = derive_group_from_tokens(tokens)
        home_slot, away_slot = normalize_slot_tokens(strip_group_marker(tokens, group_id))
        home_team_id = home_slot
        away_team_id = away_slot
        home_slot = None
        away_slot = None
    else:
        home_slot, away_slot = normalize_slot_tokens(tokens)

    if stage == "BRONZE":
        home_slot = "LOSER_SF_1"
        away_slot = "LOSER_SF_2"

    if stage == "FINAL":
        home_slot = "WINNER_SF_1"
        away_slot = "WINNER_SF_2"

    return {
        "matchId": f"m_{official_match_number:03d}",
        "officialMatchNumber": official_match_number,
        "stage": stage,
        "groupId": group_id,
        "homeTeamId": home_team_id,
        "awayTeamId": away_team_id,
        "homeSlot": home_slot,
        "awaySlot": away_slot,
        "kickoffAtEt": kickoff_et,
        "kickoffAtUtc": kickoff_utc,
        "venueId": venue_id,
        "status": "scheduled",
        "isLocked": False,
        "isScored": False,
    }


def main() -> None:
    payload = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    matches = [normalize_match(row) for row in payload["matches"]]

    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "source": payload["source"],
                "notes": [
                    "This file is a normalized schedule seed candidate derived from the official FIFA PDF.",
                    "Knockout slots remain symbolic until group standings and prior winners are resolved.",
                    "kickoffAtUtc is the canonical backend timestamp; kickoffAtEt preserves the official schedule basis.",
                ],
                "matches": matches,
            },
            indent=2,
            ensure_ascii=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(matches)} normalized matches to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
