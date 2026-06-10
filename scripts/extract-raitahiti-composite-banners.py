#!/usr/bin/env python3
"""Découpe le composite RAI TAHITI en 10 bannières + exports IAB (sans étirement)."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets"
)
COMPOSITE = ASSETS / "ChatGPT_Image_10_juin_2026__06_55_56-c6594f42-8618-49f9-9866-d35ac057fdd0.png"
OUT = ROOT / "public/images/ads/rai-tahiti"
SEP = OUT / "separees"
LABEL_X = 182
BG = (255, 255, 255)

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

# export IAB : fichier, source id, w, h, mode (contain | cover | width)
IAB_EXPORTS: list[tuple[str, str, int, int, str]] = [
    ("rai-tahiti-ad-leaderboard-728x90.png", "01", 728, 90, "width"),
    ("rai-tahiti-ad-ribbon-468x60.png", "01", 468, 60, "ribbon"),
    ("rai-tahiti-ad-rectangle-300x250.png", "04", 300, 250, "contain"),
    ("rai-tahiti-ad-rectangle-compact-300x250.png", "05", 300, 250, "contain"),
    ("rai-tahiti-ad-card-300x200.png", "04", 300, 200, "contain"),
]


def fit_contain(src: Image.Image, w: int, h: int) -> Image.Image:
    sw, sh = src.size
    scale = min(w / sw, h / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG)
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def fit_cover(src: Image.Image, w: int, h: int) -> Image.Image:
    sw, sh = src.size
    scale = max(w / sw, h / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - w) // 2)
    top = max(0, (nh - h) // 2)
    return resized.crop((left, top, left + w, top + h))


def fit_width(src: Image.Image, w: int, h: int) -> Image.Image:
    sw, sh = src.size
    nh = max(1, int(sh * w / sw))
    resized = src.resize((w, nh), Image.Resampling.LANCZOS)
    if nh <= h:
        canvas = Image.new("RGB", (w, h), BG)
        canvas.paste(resized, (0, (h - nh) // 2))
        return canvas
    top = (nh - h) // 2
    return resized.crop((0, top, w, top + h))


def ribbon_from_leaderboard(src: Image.Image, w: int, h: int) -> Image.Image:
    """Bandeau pied de page : partie droite du leaderboard (paysage + CTA)."""
    sw, sh = src.size
    strip = src.crop((int(sw * 0.38), 0, sw, sh))
    return fit_cover(strip, w, h)


def export_iab(src: Image.Image, w: int, h: int, mode: str) -> Image.Image:
    if mode == "width":
        return fit_width(src, w, h)
    if mode == "ribbon":
        return ribbon_from_leaderboard(src, w, h)
    if mode == "cover":
        return fit_cover(src, w, h)
    return fit_contain(src, w, h)


def main() -> None:
    if not COMPOSITE.exists():
        raise SystemExit(f"Composite introuvable : {COMPOSITE}")

    if SEP.exists():
        shutil.rmtree(SEP)
    SEP.mkdir(parents=True, exist_ok=True)

    src = Image.open(COMPOSITE).convert("RGB")
    print(f"Source: {COMPOSITE.name} ({src.size[0]}×{src.size[1]})")

    crops: dict[str, Image.Image] = {}
    for bid, name, box in BANNERS:
        crop = src.crop(box)
        crops[bid] = crop
        path = SEP / f"rai-tahiti-{name}"
        crop.save(path, optimize=True, quality=95)
        print(f"  separees/rai-tahiti-{name}  {crop.size[0]}×{crop.size[1]}")

    for out_name, bid, w, h, mode in IAB_EXPORTS:
        out = export_iab(crops[bid], w, h, mode)
        path = OUT / out_name
        out.save(path, optimize=True, quality=95)
        print(f"  {out_name}  {w}×{h} ({mode})")

    # Legacy : même visuel leaderboard (plus d'étirement billboard)
    lb = OUT / "rai-tahiti-ad-leaderboard-728x90.png"
    for legacy in (
        "rai-tahiti-ad-billboard-970x250.png",
        "rai-tahiti-ad-billboard-ocean-970x250.png",
    ):
        shutil.copy2(lb, OUT / legacy)
        print(f"  {legacy}  ← leaderboard (fallback)")

    print("OK")


if __name__ == "__main__":
    main()
