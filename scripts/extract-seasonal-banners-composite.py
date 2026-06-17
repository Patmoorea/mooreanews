#!/usr/bin/env python3
"""
Découpe la planche 2×6 de bannières MooreaNews en 12 fichiers distincts.
Source : assets ChatGPT composite (1024×546, 6 lignes × 2 colonnes).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

COMPOSITE = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets/"
    "ChatGPT_Image_17_juin_2026_a__09_16_40-99872f51-d71b-404c-9ac6-4538f540bece.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "brand" / "seasonal" / "banners"

# (slug, colonne 0=gauche 1=droite, ligne 0–5)
BANNERS: list[tuple[str, int, int]] = [
    ("nouvel-an", 0, 0),
    ("saint-valentin", 1, 0),
    ("paques", 0, 1),
    ("heiva", 1, 1),
    ("baleines", 0, 2),
    ("hawaiki-nui", 1, 2),
    ("rentree-scolaire", 0, 3),
    ("octobre-rose", 1, 3),
    ("coupe-du-monde", 0, 4),
    ("noel", 1, 4),
    ("vigilance-meteo", 0, 5),
    ("anniversaire", 1, 5),
]


def main() -> None:
    src = Image.open(COMPOSITE).convert("RGBA")
    w, h = src.size
    row_bounds = [0, 98, 194, 289, 377, 457, h]
    col_bounds = [0, w // 2, w]

    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Source {COMPOSITE.name} ({w}×{h}), grille 2×6\n")

    for slug, col, row in BANNERS:
        box = (
            col_bounds[col],
            row_bounds[row],
            col_bounds[col + 1],
            row_bounds[row + 1],
        )
        crop = src.crop(box)
        path = OUT / f"{slug}.png"
        crop.save(path, optimize=True)
        print(f"  {slug}.png  {crop.size[0]}×{crop.size[1]}")

    print(f"\n{len(BANNERS)} bannières → {OUT}")


if __name__ == "__main__":
    main()
