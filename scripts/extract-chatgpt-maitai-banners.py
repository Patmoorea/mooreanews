#!/usr/bin/env python3
"""Découpe le visuel ChatGPT composite en bannières IAB pour MooreaNews."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

COMPOSITE = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets/"
    "ChatGPT_Image_9_juin_2026__09_25_10-31ae9402-9530-473b-86d2-b2e77a23f49d.png"
)
OUT = Path("/Users/patricejourdan/Desktop/moorea-hub/public/images/ads/moorea-maitai")
DESK = Path("/Users/patricejourdan/Desktop/Moorea-Maitai-ads")

EXPORTS: list[tuple[str, tuple[int, int, int, int] | None, int, int, str]] = [
    ("moorea-maitai-ad-billboard-970x250.png", (10, 10, 736, 196), 970, 250, "cover"),
    ("moorea-maitai-ad-billboard-sunset-970x250.png", None, 970, 250, "cover"),
    ("moorea-maitai-ad-leaderboard-728x90.png", (4, 530, 1018, 614), 728, 90, "width"),
    ("moorea-maitai-ad-rectangle-300x250.png", (10, 252, 380, 502), 300, 250, "cover"),
    ("moorea-maitai-ad-rectangle-compact-300x250.png", (408, 258, 736, 368), 300, 250, "cover"),
    ("moorea-maitai-ad-card-300x200.png", (408, 400, 736, 518), 300, 200, "cover"),
    ("moorea-maitai-ad-ribbon-468x60.png", (4, 658, 1018, 682), 468, 60, "width"),
]


def fit_cover(img: Image.Image, w: int, h: int) -> Image.Image:
    src = img.copy()
    sw, sh = src.size
    target = w / h
    src_ratio = sw / sh
    if src_ratio > target:
        nw = int(sh * target)
        left = (sw - nw) // 2
        src = src.crop((left, 0, left + nw, sh))
    else:
        nh = int(sw / target)
        top = (sh - nh) // 2
        src = src.crop((0, top, sw, top + nh))
    return src.resize((w, h), Image.Resampling.LANCZOS)


def fit_width_pad(img: Image.Image, w: int, h: int, bg: tuple[int, int, int] = (0, 0, 0)) -> Image.Image:
    """Préserve toute la largeur (bandeaux horizontaux sans couper les bords)."""
    sw, sh = img.size
    scaled_h = max(1, round(sh * w / sw))
    scaled = img.resize((w, scaled_h), Image.Resampling.LANCZOS)
    if scaled_h >= h:
        top = (scaled_h - h) // 2
        return scaled.crop((0, top, w, top + h))
    canvas = Image.new("RGB", (w, h), bg)
    top = (h - scaled_h) // 2
    canvas.paste(scaled, (0, top))
    return canvas


def save(img: Image.Image, name: str) -> None:
    for base in (OUT, DESK):
        base.mkdir(parents=True, exist_ok=True)
        path = base / name
        img.save(path, optimize=True, quality=93)
        print(f"OK {path} {img.size}")


def main() -> None:
    src = Image.open(COMPOSITE).convert("RGB")
    sky = src.crop((748, 8, 1016, 668))
    sunset_hero = sky.crop((95, 0, 268, 420))

    for name, box, w, h, mode in EXPORTS:
        if box is None:
            crop = sunset_hero
        else:
            crop = src.crop(box)
        if mode == "width":
            img = fit_width_pad(crop, w, h)
        else:
            img = fit_cover(crop, w, h)
        save(img, name)


if __name__ == "__main__":
    main()
