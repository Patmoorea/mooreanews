#!/usr/bin/env python3
"""Bannières RAI TAHITI — export IAB plein cadre (sans bandes blanches)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/images/ads/rai-tahiti"
SEP = OUT / "separees"

SLOT_NAMES: dict[str, str] = {
    "01": "01-leaderboard",
    "02": "02-inline",
    "03": "03-mobile",
    "04": "04-medium-rectangle",
    "05": "05-large-rectangle",
    "06-card": "06-card-square",
    "06-half": "06-half-page",
    "07": "07-skyscraper",
    "08": "08-facebook",
    "09": "09-instagram",
    "10": "10-pinterest",
}


def find_separee(key: str) -> Path | None:
    name = SLOT_NAMES[key]
    matches = sorted(SEP.glob(f"rai-tahiti-{name}-*.png"))
    if matches:
        return matches[0]
    matches = sorted(SEP.glob(f"rai-tahiti-{key}-*.png"))
    return matches[0] if matches else None


def rename_with_actual_size(path: Path, canonical: str) -> Path:
    img = Image.open(path)
    w, h = img.size
    target = SEP / f"rai-tahiti-{canonical}-{w}x{h}.png"
    if path.resolve() != target.resolve():
        if target.exists() and target.resolve() != path.resolve():
            target.unlink()
        path.rename(target)
    return target


def fit_cover(src: Image.Image, w: int, h: int) -> Image.Image:
    """Remplit tout le cadre IAB — recadre si besoin, pas de bandes vides."""
    sw, sh = src.size
    scale = max(w / sw, h / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - w) // 2)
    top = max(0, (nh - h) // 2)
    return resized.crop((left, top, left + w, top + h))


def pick(*keys: str, loaded: dict[str, Image.Image]) -> Image.Image | None:
    for key in keys:
        if key in loaded:
            return loaded[key]
    return None


def main() -> None:
    SEP.mkdir(parents=True, exist_ok=True)
    loaded: dict[str, Image.Image] = {}

    for key, canonical in SLOT_NAMES.items():
        src_path = find_separee(key)
        if not src_path:
            print(f"  SKIP {key} — introuvable dans separees/")
            continue
        renamed = rename_with_actual_size(src_path, canonical)
        img = Image.open(renamed).convert("RGB")
        loaded[key] = img
        print(f"  {renamed.name}  ({img.size[0]}×{img.size[1]})")

    if "01" not in loaded:
        raise SystemExit("Bannière 01-leaderboard introuvable dans separees/")

    exports: list[tuple[str, Image.Image]] = [
        (
            "rai-tahiti-ad-leaderboard-728x90.png",
            fit_cover(loaded["01"], 728, 90),
        ),
        (
            "rai-tahiti-ad-ribbon-468x60.png",
            fit_cover(pick("02", "03", loaded=loaded) or loaded["01"], 468, 60),
        ),
        (
            "rai-tahiti-ad-rectangle-300x250.png",
            fit_cover(pick("05", "04", "08", loaded=loaded) or loaded["01"], 300, 250),
        ),
        (
            "rai-tahiti-ad-rectangle-compact-300x250.png",
            fit_cover(pick("04", "05", loaded=loaded) or loaded["01"], 300, 250),
        ),
        (
            "rai-tahiti-ad-card-300x200.png",
            fit_cover(pick("06-card", "04", "09", loaded=loaded) or loaded["01"], 300, 200),
        ),
        (
            "rai-tahiti-ad-billboard-970x250.png",
            fit_cover(pick("01", "08", "05", loaded=loaded) or loaded["01"], 970, 250),
        ),
    ]

    for name, img in exports:
        img.save(OUT / name, optimize=True, quality=95)
        print(f"  → {name}  {img.size[0]}×{img.size[1]}")

    print("OK")


if __name__ == "__main__":
    main()
