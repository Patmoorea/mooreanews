#!/usr/bin/env python3
"""Installe les bannières RAI TAHITI fournies (assets/) — copie directe, redimension proportionnel uniquement."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets"
)
OUT = ROOT / "public/images/ads/rai-tahiti"
SEP = OUT / "separees"
BG = (255, 255, 255)

# prefixe fichier assets → nom separees
ASSET_NAMES: dict[str, str] = {
    "01": "01-leaderboard-728x90.png",
    "02": "02-inline-468x60.png",
    "03": "03-mobile-320x50.png",
    "04": "04-medium-rectangle-300x250.png",
    "05": "05-large-rectangle-336x280.png",
    "06-card": "06-card-square.png",
    "06-half": "06-half-page-300x600.png",
    "07": "07-skyscraper-160x600.png",
    "08": "08-facebook-1200x628.png",
    "10": "10-pinterest-1000x1500.png",
}


def find_asset(prefix: str) -> Path | None:
    matches = sorted(ASSETS.glob(f"rai-tahiti-{prefix}-*.png"))
    return matches[0] if matches else None


def fit_width_pad(src: Image.Image, w: int, h: int) -> Image.Image:
    """Largeur cible, hauteur proportionnelle, centré sur fond blanc (jamais d'étirement)."""
    sw, sh = src.size
    nh = max(1, int(sh * w / sw))
    resized = src.resize((w, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG)
    canvas.paste(resized, (0, (h - nh) // 2))
    return canvas


def fit_contain(src: Image.Image, w: int, h: int) -> Image.Image:
    sw, sh = src.size
    scale = min(w / sw, h / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG)
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def ribbon_from_leaderboard(lb: Image.Image, w: int = 468, h: int = 60) -> Image.Image:
    """Ruban pied de page : zone droite du leaderboard (paysage + bouton), sans étirer."""
    sw, sh = lb.size
    strip = lb.crop((int(sw * 0.52), 0, sw, sh))
    sw2, sh2 = strip.size
    scale = min(w / sw2, h / sh2)
    nw, nh = max(1, int(sw2 * scale)), max(1, int(sh2 * scale))
    resized = strip.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG)
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def main() -> None:
    SEP.mkdir(parents=True, exist_ok=True)
    loaded: dict[str, Image.Image] = {}

    for key, sep_name in ASSET_NAMES.items():
        src_path = find_asset(key)
        if not src_path:
            print(f"  SKIP {key} — fichier assets introuvable")
            continue
        img = Image.open(src_path).convert("RGB")
        loaded[key] = img
        dest = SEP / f"rai-tahiti-{sep_name}"
        shutil.copy2(src_path, dest)
        print(f"  separees/rai-tahiti-{sep_name}  ← {src_path.name} ({img.size[0]}×{img.size[1]})")

    if "01" not in loaded:
        raise SystemExit("Bannière 01-leaderboard introuvable dans assets/")

    lb = loaded["01"]

    exports: list[tuple[str, Image.Image]] = [
        ("rai-tahiti-ad-leaderboard-728x90.png", fit_width_pad(lb, 728, 90)),
        ("rai-tahiti-ad-ribbon-468x60.png", ribbon_from_leaderboard(lb, 468, 60)),
    ]

    if "04" in loaded:
        exports.append(("rai-tahiti-ad-rectangle-300x250.png", fit_contain(loaded["04"], 300, 250)))
        exports.append(("rai-tahiti-ad-card-300x200.png", fit_contain(loaded["04"], 300, 200)))
    if "05" in loaded:
        exports.append(
            ("rai-tahiti-ad-rectangle-compact-300x250.png", fit_contain(loaded["05"], 300, 250))
        )

    for name, img in exports:
        img.save(OUT / name, optimize=True, quality=95)
        print(f"  {name}  {img.size[0]}×{img.size[1]}")

    print("OK")


if __name__ == "__main__":
    main()
