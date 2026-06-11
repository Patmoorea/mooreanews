#!/usr/bin/env python3
"""Bannières RAI TAHITI : renomme separees/ selon dimensions réelles, export IAB proportionnel."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/images/ads/rai-tahiti"
SEP = OUT / "separees"
BG = (255, 255, 255)

# clé de recherche → nom canonique (sans dimensions)
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


def fit_width_pad(src: Image.Image, w: int, h: int) -> Image.Image:
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

    lb = loaded["01"]
    inline = loaded.get("02")

    exports: list[tuple[str, Image.Image]] = [
        ("rai-tahiti-ad-leaderboard-728x90.png", fit_width_pad(lb, 728, 90)),
    ]

    if inline:
        exports.append(("rai-tahiti-ad-ribbon-468x60.png", fit_contain(inline, 468, 60)))
    else:
        sw, sh = lb.size
        strip = lb.crop((int(sw * 0.52), 0, sw, sh))
        exports.append(("rai-tahiti-ad-ribbon-468x60.png", fit_contain(strip, 468, 60)))

    if "04" in loaded:
        exports.append(("rai-tahiti-ad-rectangle-300x250.png", fit_contain(loaded["04"], 300, 250)))
    if "05" in loaded:
        exports.append(
            ("rai-tahiti-ad-rectangle-compact-300x250.png", fit_contain(loaded["05"], 300, 250))
        )
    if "06-card" in loaded:
        exports.append(("rai-tahiti-ad-card-300x200.png", fit_contain(loaded["06-card"], 300, 200)))
    elif "04" in loaded:
        exports.append(("rai-tahiti-ad-card-300x200.png", fit_contain(loaded["04"], 300, 200)))

    # Grand encart 970×250 — source la plus large disponible (Facebook / half-page)
    billboard_src = loaded.get("08") or loaded.get("05") or loaded.get("06-half")
    if billboard_src:
        exports.append(("rai-tahiti-ad-billboard-970x250.png", fit_contain(billboard_src, 970, 250)))

    for name, img in exports:
        img.save(OUT / name, optimize=True, quality=95)
        print(f"  → {name}  {img.size[0]}×{img.size[1]}")

    print("OK")


if __name__ == "__main__":
    main()
