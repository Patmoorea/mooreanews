#!/usr/bin/env python3
"""Exporte les visuels pub Moorea Maitai aux dimensions IAB exactes."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ASSETS = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets"
)
OUT = Path("/Users/patricejourdan/Desktop/moorea-hub/public/images/ads/moorea-maitai")
DESK = Path("/Users/patricejourdan/Desktop/Moorea-Maitai-ads")

SIZES: list[tuple[str, int, int, str]] = [
    ("leaderboard-728x90", 728, 90, "moorea-maitai-ad-728x90.png"),
    ("billboard-970x250", 970, 250, "moorea-maitai-ad-970x250.png"),
    ("rectangle-300x250", 300, 250, "moorea-maitai-ad-300x250.png"),
    ("ribbon-468x60", 468, 60, "moorea-maitai-ad-468x60.png"),
]


def export_exact(name: str, w: int, h: int, src_name: str) -> None:
    src = ASSETS / src_name
    if not src.exists():
        print(f"SKIP missing {src}")
        return
    img = Image.open(src).convert("RGB")
    # Recadrage centré puis redimensionnement exact
    sw, sh = img.size
    target_ratio = w / h
    src_ratio = sw / sh
    if src_ratio > target_ratio:
        new_w = int(sh * target_ratio)
        left = (sw - new_w) // 2
        img = img.crop((left, 0, left + new_w, sh))
    else:
        new_h = int(sw / target_ratio)
        top = (sh - new_h) // 2
        img = img.crop((0, top, sw, top + new_h))
    out = img.resize((w, h), Image.Resampling.LANCZOS)
    for base in (OUT, DESK):
        base.mkdir(parents=True, exist_ok=True)
        path = base / f"moorea-maitai-ad-{name}.png"
        out.save(path, optimize=True, quality=92)
        print(f"OK {path} ({w}x{h})")


def card_from_billboard() -> None:
    src = ASSETS / "moorea-maitai-ad-970x250.png"
    if not src.exists():
        return
    img = Image.open(src).convert("RGB")
    w, h = 300, 200
    sw, sh = img.size
    target_ratio = w / h
    src_ratio = sw / sh
    if src_ratio > target_ratio:
        new_w = int(sh * target_ratio)
        left = (sw - new_w) // 2
        img = img.crop((left, 0, left + new_w, sh))
    else:
        new_h = int(sw / target_ratio)
        top = (sh - new_h) // 2
        img = img.crop((0, top, sw, top + new_h))
    out = img.resize((w, h), Image.Resampling.LANCZOS)
    for base in (OUT, DESK):
        base.mkdir(parents=True, exist_ok=True)
        path = base / "moorea-maitai-ad-card-300x200.png"
        out.save(path, optimize=True, quality=92)
        print(f"OK {path} (300x200)")


def main() -> None:
    for name, w, h, src in SIZES:
        export_exact(name, w, h, src)
    card_from_billboard()


if __name__ == "__main__":
    main()
