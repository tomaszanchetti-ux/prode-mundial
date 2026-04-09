#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from io import BytesIO
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:
    print(
        "Missing dependency: pypdf. Install with `python3 -m pip install --user pypdf cryptography`.",
        file=sys.stderr,
    )
    raise SystemExit(1) from exc


PDF_URL = "https://digitalhub.fifa.com/asset/00d96870-7dd7-48f9-9549-635a53b1bcc8/FWC26-Match-Schedule_Spanish.pdf"
OUTPUT_PATH = Path(
    "/Users/tzanchetti/Documents/Proyectos Claudio/prode-mundial/apps/api/src/domains/matches/data/world-cup-2026-raw-schedule.json"
)

VENUES = [
    ("vancouver", "VANCOUVER", 705.1),
    ("seattle", "SEATTLE", 667.8),
    ("san-francisco-bay-area", "SAN FRANCISCO", 625.9),
    ("los-angeles", "LOS ÁNGELES", 594.4),
    ("guadalajara", "GUADALAJARA", 556.3),
    ("mexico-city", "CIUDAD DE MÉXICO", 519.3),
    ("monterrey", "MONTERREY", 481.9),
    ("houston", "HOUSTON", 444.7),
    ("dallas", "DALLAS", 407.7),
    ("kansas-city", "KANSAS CITY", 370.5),
    ("atlanta", "ATLANTA", 333.4),
    ("miami", "MIAMI", 296.2),
    ("toronto", "TORONTO", 259.0),
    ("boston", "BOSTON", 221.8),
    ("philadelphia", "FILADELFIA", 184.6),
    ("new-york-new-jersey", "NUEVA YORK NUEVA JERSEY", 147.7),
]


def normalize_text(value: str) -> str:
    return " ".join(value.split())


def extract_items(pdf_bytes: bytes) -> list[tuple[float, float, str]]:
    reader = PdfReader(BytesIO(pdf_bytes))
    page = reader.pages[0]
    items: list[tuple[float, float, str]] = []

    def visitor(text, cm, tm, font_dict, font_size) -> None:
        x = round(tm[4], 1)
        y = round(tm[5], 1)
        cleaned = normalize_text(text)
        if cleaned:
            items.append((x, y, cleaned))

    page.extract_text(visitor_text=visitor)
    return items


def parse_time_token(token: str) -> tuple[int, str] | None:
    compact = token.replace(" ", "")
    match = re.match(r"^(\d+)(\d\d:\d\d)$", compact)
    if match is None:
        return None

    return int(match.group(1)), match.group(2)


def build_dates(items: list[tuple[float, float, str]]) -> list[tuple[float, str]]:
    dates: list[tuple[float, str]] = []
    for x, y, text in sorted(items, key=lambda item: (item[0], -item[1])):
        if y == 732.5 and "de " in text and text not in [date for _, date in dates]:
            dates.append((x, text))
    return dates


def nearest_date(date_columns: list[tuple[float, str]], x: float) -> str:
    return min(date_columns, key=lambda item: abs(item[0] - x))[1]


def collect_sightings(items: list[tuple[float, float, str]]) -> dict[int, list[dict[str, object]]]:
    date_columns = build_dates(items)
    grouped: dict[int, list[dict[str, object]]] = {}

    for index, (venue_id, venue_label, venue_y) in enumerate(VENUES):
        next_y = VENUES[index + 1][2] if index + 1 < len(VENUES) else 120.0
        band = [
            item
            for item in items
            if next_y + 5 < item[1] <= venue_y + 25 and item[0] > 150
        ]

        for x, y, text in band:
            parsed = parse_time_token(text)
            if parsed is None:
                continue

            official_match_number, time_et = parsed
            nearby = sorted(
                [
                    item
                    for item in band
                    if abs(item[0] - x) <= 28 and y - 32 <= item[1] <= y + 5
                ],
                key=lambda item: (-item[1], item[0]),
            )
            tokens = [token for _, _, token in nearby if token != text]
            grouped.setdefault(official_match_number, []).append(
                {
                    "dateLabel": nearest_date(date_columns, x),
                    "timeEt": time_et,
                    "venueId": venue_id,
                    "venueLabel": venue_label,
                    "tokens": tokens,
                }
            )

    return grouped


def main() -> None:
    with tempfile.NamedTemporaryFile(suffix=".pdf") as pdf_file:
        subprocess.run(
            ["curl", "-L", PDF_URL, "-o", pdf_file.name],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        pdf_bytes = Path(pdf_file.name).read_bytes()

    items = extract_items(pdf_bytes)
    sightings_by_match = collect_sightings(items)

    rows = [
        {
            "officialMatchNumber": match_number,
            "sightings": sightings_by_match[match_number],
        }
        for match_number in sorted(sightings_by_match)
    ]

    payload = {
        "source": {
            "label": "FIFA 2026 official match schedule PDF (Spanish)",
            "url": PDF_URL,
            "publishedAt": "2026-04-01T00:00:00Z",
            "notes": [
                "The FIFA PDF states that all kickoff times are shown in ET.",
                "This file is a raw extraction snapshot grouped by official match number.",
                "Some sightings are partial because the source PDF is a visual poster layout, not a structured table.",
            ],
        },
        "matches": rows,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} grouped rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
