#!/usr/bin/env python3
"""Découpe le composite ChatGPT — SANS recadrer le contenu (fit contain uniquement)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

COMPOSITE = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets/"
    "ChatGPT_Image_9_juin_2026__09_25_10-654d1dc5-85d9-491e-a0b8-f8a8df766903.png"
)
OUT = Path("/Users/patricejourdan/Desktop/moorea-hub/public/images/ads/moorea-maitai")
DESK = Path("/Users/patricejourdan/Desktop/Moorea-Maitai-ads")
BG = (0, 0, 0)

EXPORTS: list[tuple[str, tuple[int, int, int, int] | None, int, int]] = [
    ("moorea-maitai-ad-billboard-970x250.png", (8, 8, 740, 198), 970, 250),
    ("moorea-maitai-ad-billboard-sunset-970x250.png", None, 970, 250),
    ("moorea-maitai-ad-leaderboard-728x90.png", (4, 528, 1020, 616), 728, 90),
    ("moorea-maitai-ad-rectangle-300x250.png", (8, 252, 398, 504), 300, 250),
    ("moorea-maitai-ad-rectangle-compact-300x250.png", (406, 256, 740, 370), 300, 250),
    ("moorea-maitai-ad-card-300x200.png", (406, 398, 740, 520), 300, 200),
    ("moorea-maitai-ad-ribbon-468x60.png", (4, 656, 1020, 682), 468, 60),
]


def fit_contain(img: Image.Image, w: int, h: int, bg: tuple[int, int, int] = BG) -> Image.Image:
    """Redimensionne en gardant TOUT le visuel visible (jamais de crop)."""
    sw, sh = img.size
    scale = min(w / sw, h / sh)
    nw = max(1, round(sw * scale))
    nh = max(1, round(sh * scale))
    scaled = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), bg)
    canvas.paste(scaled, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def save(img: Image.Image, name: str) -> None:
    for base in (OUT, DESK):
        base.mkdir(parents=True, exist_ok=True)
        path = base / name
        img.save(path, optimize=True, quality=93)
        print(f"OK {path} {img.size}")


def main() -> None:
    src = Image.open(COMPOSITE).convert("RGB")
    sky = src.crop((746, 6, 1018, 670))
    sunset_hero = sky.crop((92, 0, 272, 422))

    for name, box, w, h in EXPORTS:
        crop = sunset_hero if box is None else src.crop(box)
        save(fit_contain(crop, w, h), name)


if __name__ == "__main__":
    main()
