#!/usr/bin/env python3
"""Découpe le composite RAI TAHITI en 10 bannières + exports IAB pour MooreaNews."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets"
)
COMPOSITE = ASSETS / "ChatGPT_Image_10_juin_2026__06_55_56-8596d7a7-1169-4dba-bc95-7a5b0487cf9f.png"
OUT = ROOT / "public/images/ads/rai-tahiti"
SEP = OUT / "separees"
LABEL_X = 182  # ignorer la colonne de labels à gauche

# id, fichier separees, crop x1,y1,x2,y2
BANNERS: list[tuple[str, str, tuple[int, int, int, int]]] = [
    ("01", "01-leaderboard-728x90.png", (LABEL_X, 16, 1012, 105)),
    ("02", "02-inline-468x60.png", (LABEL_X, 129, 354, 189)),
    ("03", "03-mobile-320x50.png", (182, 189, 502, 239)),
    ("04", "04-medium-rectangle-300x250.png", (375, 129, 563, 339)),
    ("05", "05-large-rectangle-336x280.png", (574, 129, 797, 339)),
    ("06", "06-half-page-300x600.png", (574, 129, 798, 646)),
    ("07", "07-skyscraper-160x600.png", (182, 129, 354, 646)),
    ("08", "08-facebook-1200x628.png", (285, 365, 716, 646)),
    ("09", "09-instagram-1080x1080.png", (820, 129, 1012, 400)),
    ("10", "10-pinterest-1000x1500.png", (753, 365, 1012, 646)),
]

# fichiers IAB site MooreaNews ← bannière source, largeur, hauteur
IAB_EXPORTS: list[tuple[str, str, int, int]] = [
    ("rai-tahiti-ad-leaderboard-728x90.png", "01", 728, 90),
    ("rai-tahiti-ad-ribbon-468x60.png", "02", 468, 60),
    ("rai-tahiti-ad-rectangle-300x250.png", "04", 300, 250),
    ("rai-tahiti-ad-rectangle-compact-300x250.png", "05", 300, 250),
    ("rai-tahiti-ad-card-300x200.png", "04", 300, 200),
    ("rai-tahiti-ad-billboard-970x250.png", "08", 970, 250),
    ("rai-tahiti-ad-billboard-ocean-970x250.png", "10", 970, 250),
]


def resize_exact(src: Image.Image, w: int, h: int) -> Image.Image:
    return src.resize((w, h), Image.Resampling.LANCZOS)


def main() -> None:
    if not COMPOSITE.exists():
        raise SystemExit(f"Composite introuvable : {COMPOSITE}")

    src = Image.open(COMPOSITE).convert("RGB")
    SEP.mkdir(parents=True, exist_ok=True)
    print(f"Source: {COMPOSITE.name} ({src.size[0]}×{src.size[1]})")

    crops: dict[str, Image.Image] = {}
    for bid, name, box in BANNERS:
        crop = src.crop(box)
        crops[bid] = crop
        path = SEP / f"rai-tahiti-{name}"
        crop.save(path, optimize=True, quality=95)
        print(f"  separees/rai-tahiti-{name}  {crop.size[0]}×{crop.size[1]}")

    for out_name, bid, w, h in IAB_EXPORTS:
        out = resize_exact(crops[bid], w, h)
        path = OUT / out_name
        out.save(path, optimize=True, quality=95)
        print(f"  {out_name}  {w}×{h}")

    print("OK")


if __name__ == "__main__":
    main()
