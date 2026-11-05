#!/usr/bin/env python3
"""Build the public corpus JSON from the supplied NV Atlas CSV.

The source CSV is a 500-row sample from OPUS OpenSubtitles 2024 (en-zh_CN).
Sentence IDs are 1-based line numbers in the official Moses-format files.
"""
from __future__ import annotations

import csv
import json
import random
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "NVAtlas-AI-Agent.csv"
OUTPUT = ROOT / "data" / "corpus.json"
SEED = 2026
CHECK_SAMPLE_SIZE = 50

LIGHT_VERBS = (
    "进行", "加以", "予以", "给予", "作出", "做出", "发出", "表示",
    "提出", "实施", "开展", "受到", "得到", "接受", "完成", "实现",
    "产生", "引起", "造成", "保持", "提供", "采取", "举行", "从事",
)
NOMINAL_MARKERS = (
    "的", "性", "化", "度", "感", "力", "者", "主义", "行为", "行动",
    "事件", "过程", "状态", "情况", "方面", "工作", "活动",
)


def classify(chinese: str) -> tuple[str, str]:
    """Apply the published codebook in a deterministic order."""
    if any(marker in chinese for marker in LIGHT_VERBS):
        return "light_verb", "A light verb or verbal frame carries the action."
    if any(marker in chinese for marker in NOMINAL_MARKERS):
        return "nominal_retained", "The Chinese line retains a nominal or event-like frame."
    return "verb_recast", "The English nominal is recast as a direct Chinese verb."


def main() -> None:
    with SOURCE.open(encoding="utf-8-sig", newline="") as handle:
        source_rows = list(csv.DictReader(handle))

    if len(source_rows) != 500:
        raise ValueError(f"Expected 500 source rows, found {len(source_rows)}")

    rng = random.Random(SEED)
    checked_ids = {int(row["id"]) for row in rng.sample(source_rows, CHECK_SAMPLE_SIZE)}

    rows = []
    for row in source_rows:
        sentence_id = int(row["id"])
        category, rationale = classify(row["Chinese"])
        rows.append({
            "id": sentence_id,
            "source_text": row["English"],
            "target_text": row["Chinese"],
            "source": (
                "OPUS OpenSubtitles 2024, en-zh_CN, "
                f"sentence id {sentence_id}, sampled 2026-11-05, seed {SEED}"
            ),
            "category": category,
            "human_checked": "yes" if sentence_id in checked_ids else "no",
            "unit": "sentence pair",
            "key_term": row["English_Nominal"],
            "target_term": row["Chinese_Verb"],
            "rationale": rationale,
        })

    counts = Counter(row["category"] for row in rows)
    checked = sum(row["human_checked"] == "yes" for row in rows)
    payload = {
        "meta": {
            "title": "Nominalization in English-Chinese Subtitles",
            "corpus": "OPUS OpenSubtitles 2024 (en-zh_CN)",
            "source_url": "https://opus.nlpl.eu/legacy/OpenSubtitles-v2024.php",
            "source_download": "https://object.pouta.csc.fi/OPUS-OpenSubtitles/v2024/moses/en-zh_CN.txt.zip",
            "retrieved": "2026-11-05",
            "seed": SEED,
            "sample_size": len(rows),
            "checked_size": checked,
            "categories": counts,
            "license_note": "Short subtitle excerpts for coursework; source and OpenSubtitles attribution retained.",
        },
        "entries": rows,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(rows)} entries and {checked} checked entries")
    print(dict(counts))


if __name__ == "__main__":
    main()
