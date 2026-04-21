#!/usr/bin/env python3
"""Build canonical World Cup 2026 match schedule from verified Wikipedia data.

Replaces the PDF extraction pipeline (extract + normalize), which had systemic
day-label bugs — matches on later days were assigned to earlier days because
the FIFA PDF poster layout caused the extractor to misalign date labels.

Canonical source: Wikipedia group-stage and knockout-stage articles, each of
which states kickoff times in the local timezone of each venue. Each row below
captures: officialMatchNumber, date (YYYY-MM-DD at venue local), local HH:MM,
and venue UTC offset in hours. From those we derive kickoffAtUtc deterministically.

Team IDs, venue IDs, slot labels, and stage metadata are preserved from the
prior normalized JSON — only kickoffAtUtc and kickoffAtEt are recomputed.

Run:  python3 scripts/build_canonical_world_cup_2026_schedule.py
Outputs:
  - apps/api/src/domains/matches/data/world-cup-2026-canonical-matches.json
  - stdout diff report (canonical vs current normalized)
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


REPO_ROOT = Path(__file__).resolve().parent.parent
CURRENT_JSON = REPO_ROOT / "apps/api/src/domains/matches/data/world-cup-2026-normalized-matches.json"
OUTPUT_JSON = REPO_ROOT / "apps/api/src/domains/matches/data/world-cup-2026-canonical-matches.json"

ET_ZONE = ZoneInfo("America/New_York")

# (matchNumber, localDate, localTime, utcOffsetHours)
# Sourced from Wikipedia pages (Groups A-L + knockout stage), April 2026 snapshot.
CANONICAL_KICKOFFS: list[tuple[int, str, str, int]] = [
    # Group A
    (1,  "2026-06-11", "13:00", -6),  # MEX v RSA, Mexico City
    (2,  "2026-06-11", "20:00", -6),  # KOR v CZE, Zapopan (Guadalajara)
    (25, "2026-06-18", "12:00", -4),  # CZE v RSA, Atlanta
    (28, "2026-06-18", "19:00", -6),  # MEX v KOR, Zapopan
    (53, "2026-06-24", "19:00", -6),  # CZE v MEX, Mexico City
    (54, "2026-06-24", "19:00", -6),  # RSA v KOR, Guadalupe (Monterrey)
    # Group B
    (3,  "2026-06-12", "15:00", -4),  # CAN v BIH, Toronto
    (8,  "2026-06-13", "12:00", -7),  # QAT v SUI, Santa Clara (SF)
    (26, "2026-06-18", "12:00", -7),  # SUI v BIH, Inglewood (LA)
    (27, "2026-06-18", "15:00", -7),  # CAN v QAT, Vancouver
    (51, "2026-06-24", "12:00", -7),  # SUI v CAN, Vancouver
    (52, "2026-06-24", "12:00", -7),  # BIH v QAT, Seattle
    # Group C
    (5,  "2026-06-13", "21:00", -4),  # HAI v SCO, Foxborough (Boston)
    (7,  "2026-06-13", "18:00", -4),  # BRA v MAR, East Rutherford (NY/NJ)
    (29, "2026-06-19", "20:30", -4),  # BRA v HAI, Philadelphia
    (30, "2026-06-19", "18:00", -4),  # SCO v MAR, Foxborough (Boston)
    (49, "2026-06-24", "18:00", -4),  # SCO v BRA, Miami Gardens
    (50, "2026-06-24", "18:00", -4),  # MAR v HAI, Atlanta
    # Group D
    (4,  "2026-06-12", "18:00", -7),  # USA v PAR, Inglewood (LA)
    (6,  "2026-06-13", "21:00", -7),  # AUS v TUR, Vancouver
    (31, "2026-06-19", "20:00", -7),  # TUR v PAR, Santa Clara (SF)
    (32, "2026-06-19", "12:00", -7),  # USA v AUS, Seattle
    (59, "2026-06-25", "19:00", -7),  # TUR v USA, Inglewood (LA)
    (60, "2026-06-25", "19:00", -7),  # PAR v AUS, Santa Clara (SF)
    # Group E
    (9,  "2026-06-14", "19:00", -4),  # CIV v ECU, Philadelphia
    (10, "2026-06-14", "12:00", -5),  # GER v CUW, Houston
    (33, "2026-06-20", "16:00", -4),  # GER v CIV, Toronto
    (34, "2026-06-20", "19:00", -5),  # ECU v CUW, Kansas City
    (55, "2026-06-25", "16:00", -4),  # CUW v CIV, Philadelphia
    (56, "2026-06-25", "16:00", -4),  # ECU v GER, East Rutherford
    # Group F
    (11, "2026-06-14", "15:00", -5),  # NED v JPN, Arlington (Dallas)
    (12, "2026-06-14", "20:00", -6),  # SWE v TUN, Guadalupe (Monterrey)
    (35, "2026-06-20", "12:00", -5),  # NED v SWE, Houston
    (36, "2026-06-20", "22:00", -6),  # TUN v JPN, Guadalupe (Monterrey)
    (57, "2026-06-25", "18:00", -5),  # JPN v SWE, Arlington (Dallas)
    (58, "2026-06-25", "18:00", -5),  # TUN v NED, Kansas City
    # Group G
    (15, "2026-06-15", "18:00", -7),  # IRN v NZL, Inglewood (LA)
    (16, "2026-06-15", "12:00", -7),  # BEL v EGY, Seattle
    (39, "2026-06-21", "12:00", -7),  # BEL v IRN, Inglewood (LA)
    (40, "2026-06-21", "18:00", -7),  # NZL v EGY, Vancouver
    (63, "2026-06-26", "20:00", -7),  # EGY v IRN, Seattle
    (64, "2026-06-26", "20:00", -7),  # NZL v BEL, Vancouver
    # Group H
    (13, "2026-06-15", "18:00", -4),  # KSA v URU, Miami Gardens
    (14, "2026-06-15", "12:00", -4),  # ESP v CPV, Atlanta
    (37, "2026-06-21", "18:00", -4),  # URU v CPV, Miami Gardens
    (38, "2026-06-21", "12:00", -4),  # ESP v KSA, Atlanta
    (65, "2026-06-26", "19:00", -5),  # CPV v KSA, Houston
    (66, "2026-06-26", "18:00", -6),  # URU v ESP, Zapopan (Guadalajara)
    # Group I
    (17, "2026-06-16", "15:00", -4),  # FRA v SEN, East Rutherford
    (18, "2026-06-16", "18:00", -4),  # IRQ v NOR, Foxborough (Boston)
    (41, "2026-06-22", "20:00", -4),  # NOR v SEN, East Rutherford
    (42, "2026-06-22", "17:00", -4),  # FRA v IRQ, Philadelphia
    (61, "2026-06-26", "15:00", -4),  # NOR v FRA, Foxborough (Boston)
    (62, "2026-06-26", "15:00", -4),  # SEN v IRQ, Toronto
    # Group J
    (19, "2026-06-16", "20:00", -5),  # ARG v ALG, Kansas City
    (20, "2026-06-16", "21:00", -7),  # AUT v JOR, Santa Clara (SF)
    (43, "2026-06-22", "12:00", -5),  # ARG v AUT, Arlington (Dallas)
    (44, "2026-06-22", "20:00", -7),  # JOR v ALG, Santa Clara (SF)
    (69, "2026-06-27", "21:00", -5),  # ALG v AUT, Kansas City
    (70, "2026-06-27", "21:00", -5),  # JOR v ARG, Arlington (Dallas)
    # Group K
    (23, "2026-06-17", "12:00", -5),  # POR v COD, Houston
    (24, "2026-06-17", "20:00", -6),  # UZB v COL, Mexico City
    (47, "2026-06-23", "12:00", -5),  # POR v UZB, Houston
    (48, "2026-06-23", "20:00", -6),  # COL v COD, Zapopan (Guadalajara)
    (71, "2026-06-27", "19:30", -4),  # COL v POR, Miami Gardens
    (72, "2026-06-27", "19:30", -4),  # COD v UZB, Atlanta
    # Group L
    (21, "2026-06-17", "19:00", -4),  # GHA v PAN, Toronto
    (22, "2026-06-17", "15:00", -5),  # ENG v CRO, Arlington (Dallas)
    (45, "2026-06-23", "16:00", -4),  # ENG v GHA, Foxborough (Boston)
    (46, "2026-06-23", "19:00", -4),  # PAN v CRO, Toronto
    (67, "2026-06-27", "17:00", -4),  # PAN v ENG, East Rutherford
    (68, "2026-06-27", "17:00", -4),  # CRO v GHA, Philadelphia
    # Round of 32
    (73, "2026-06-28", "12:00", -7),  # Inglewood (LA)
    (74, "2026-06-29", "16:30", -4),  # Foxborough (Boston)
    (75, "2026-06-29", "19:00", -6),  # Guadalupe (Monterrey)
    (76, "2026-06-29", "12:00", -5),  # Houston
    (77, "2026-06-30", "17:00", -4),  # East Rutherford
    (78, "2026-06-30", "12:00", -5),  # Arlington (Dallas)
    (79, "2026-06-30", "19:00", -6),  # Mexico City
    (80, "2026-07-01", "12:00", -4),  # Atlanta
    (81, "2026-07-01", "17:00", -7),  # Santa Clara (SF)
    (82, "2026-07-01", "13:00", -7),  # Seattle
    (83, "2026-07-02", "19:00", -4),  # Toronto
    (84, "2026-07-02", "12:00", -7),  # Inglewood (LA)
    (85, "2026-07-02", "20:00", -7),  # Vancouver
    (86, "2026-07-03", "18:00", -4),  # Miami Gardens
    (87, "2026-07-03", "20:30", -5),  # Kansas City
    (88, "2026-07-03", "13:00", -5),  # Arlington (Dallas)
    # Round of 16
    (89, "2026-07-04", "17:00", -4),  # Philadelphia
    (90, "2026-07-04", "12:00", -5),  # Houston
    (91, "2026-07-05", "16:00", -4),  # East Rutherford (corrected 2026-04-21: Wikipedia has 16:00 ET, not 20:00)
    (92, "2026-07-05", "18:00", -6),  # Mexico City
    (93, "2026-07-06", "14:00", -5),  # Arlington (Dallas)
    (94, "2026-07-06", "17:00", -7),  # Seattle
    (95, "2026-07-07", "12:00", -4),  # Atlanta
    (96, "2026-07-07", "13:00", -7),  # Vancouver
    # Quarter-finals
    (97,  "2026-07-09", "16:00", -4),  # Foxborough (Boston)
    (98,  "2026-07-10", "12:00", -7),  # Inglewood (LA)
    (99,  "2026-07-11", "17:00", -4),  # Miami Gardens
    (100, "2026-07-11", "20:00", -5),  # Kansas City
    # Semi-finals
    (101, "2026-07-14", "14:00", -5),  # Arlington (Dallas)
    (102, "2026-07-15", "15:00", -4),  # Atlanta
    # Third place + Final
    (103, "2026-07-18", "17:00", -4),  # Miami Gardens
    (104, "2026-07-19", "15:00", -4),  # East Rutherford
]


def compute_kickoff_utc(date_str: str, time_str: str, offset_h: int) -> str:
    local_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    local_tz = timezone(timedelta(hours=offset_h))
    local_aware = local_dt.replace(tzinfo=local_tz)
    utc_dt = local_aware.astimezone(timezone.utc)
    return utc_dt.isoformat().replace("+00:00", "Z")


def compute_kickoff_et(utc_iso: str) -> str:
    utc_dt = datetime.fromisoformat(utc_iso.replace("Z", "+00:00"))
    et_dt = utc_dt.astimezone(ET_ZONE)
    return et_dt.isoformat()


def main() -> None:
    assert len({n for n, *_ in CANONICAL_KICKOFFS}) == 104, "Must have 104 unique matches"

    current = json.loads(CURRENT_JSON.read_text(encoding="utf-8"))
    canonical_by_num = {n: (d, t, off) for (n, d, t, off) in CANONICAL_KICKOFFS}

    diffs: list[dict] = []
    new_matches: list[dict] = []

    for match in current["matches"]:
        n = match["officialMatchNumber"]
        if n not in canonical_by_num:
            raise RuntimeError(f"Match {n} present in normalized JSON but not in canonical table")

        date_str, time_str, offset_h = canonical_by_num[n]
        new_utc = compute_kickoff_utc(date_str, time_str, offset_h)
        new_et = compute_kickoff_et(new_utc)

        if match["kickoffAtUtc"] != new_utc:
            diffs.append({
                "matchNumber": n,
                "stage": match["stage"],
                "teams": f"{match.get('homeTeamId') or match.get('homeSlot') or '?'} v {match.get('awayTeamId') or match.get('awaySlot') or '?'}",
                "venue": match["venueId"],
                "old_utc": match["kickoffAtUtc"],
                "new_utc": new_utc,
            })

        new_match = dict(match)
        new_match["kickoffAtUtc"] = new_utc
        new_match["kickoffAtEt"] = new_et
        new_matches.append(new_match)

    output = {
        "source": {
            "label": "Wikipedia group/knockout-stage pages (cross-checked against FIFA)",
            "verifiedAt": "2026-04-21",
            "notes": [
                "Canonical SOT for match kickoffs. Built from Wikipedia local-time data by venue.",
                "Replaces the PDF-extraction pipeline, which mis-labeled days due to poster layout.",
                "Team IDs, venue IDs, slot labels, and stage metadata preserved from prior file.",
            ],
        },
        "notes": [
            "This is the canonical kickoff SOT. The match-sync job (football-data.org) must NOT overwrite kickoffAtUtc.",
            "Knockout slots remain symbolic until group standings and prior winners are resolved.",
        ],
        "matches": new_matches,
    }

    OUTPUT_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    total = len(current["matches"])
    print(f"\nWrote {total} matches to {OUTPUT_JSON.relative_to(REPO_ROOT)}\n")
    print("=" * 96)
    print(f"DIFF REPORT — {len(diffs)} of {total} matches had incorrect kickoffAtUtc")
    print("=" * 96)
    if not diffs:
        print("(no diffs — every match already matched the canonical kickoff)")
        return
    print(f"{'#':>4}  {'stage':<6}  {'teams':<14}  {'venue':<25}  {'old UTC':<22}  →  {'new UTC':<22}")
    print("-" * 96)
    for d in diffs:
        print(f"M{d['matchNumber']:03d}  {d['stage']:<6}  {d['teams']:<14}  {d['venue']:<25}  {d['old_utc']:<22}  →  {d['new_utc']:<22}")


if __name__ == "__main__":
    main()
