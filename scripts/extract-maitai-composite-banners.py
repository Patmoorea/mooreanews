#!/usr/bin/env python3
"""
Extrait chaque bannière du composite ChatGPT en fichier séparé.
Crop aux lignes blanches de séparation uniquement — aucun redimensionnement.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

COMPOSITE = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets/"
    "ChatGPT_Image_9_juin_2026__09_25_10-4ecc0d65-301e-41da-a604-9d0240552fb3.png"
)
OUT_DIRS = [
    Path("/Users/patricejourdan/Desktop/moorea-hub/public/images/ads/moorea-maitai/separees"),
    Path("/Users/patricejourdan/Desktop/Moorea-Maitai-ads/separees"),
]

# (nom fichier, x1, y1, x2, y2) — coordonnées entre les gouttières blanches
BANNERS: dict[str, tuple[int, int, int, int]] = {
    "01-billboard-top-grande.png": (4, 4, 820, 263),
    "02-skyscraper-vertical.png": (824, 4, 1020, 537),
    "03-rectangle-coucher-soleil.png": (4, 268, 339, 537),
    "04-rectangle-reserver.png": (343, 268, 820, 405),
    "05-bons-moments-reserver.png": (343, 412, 820, 537),
    "06-leaderboard-bottom.png": (4, 543, 820, 633),
    "07-ribbon-footer.png": (4, 640, 1020, 677),
}


def main() -> None:
    src = Image.open(COMPOSITE).convert("RGB")
    for out_dir in OUT_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Source: {COMPOSITE.name} ({src.size[0]}×{src.size[1]})")
    print(f"→ {len(BANNERS)} bannières\n")

    for name, box in BANNERS.items():
        crop = src.crop(box)
        for out_dir in OUT_DIRS:
            crop.save(out_dir / f"moorea-maitai-{name}", optimize=True)
        print(f"  moorea-maitai-{name}  {crop.size[0]}×{crop.size[1]}")


if __name__ == "__main__":
    main()
