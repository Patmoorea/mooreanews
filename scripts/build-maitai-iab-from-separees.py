#!/usr/bin/env python3
"""Export IAB exact depuis les bannières ChatGPT (dossier separees/)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SEP = ROOT / "public/images/ads/moorea-maitai/separees"
OUT = ROOT / "public/images/ads/moorea-maitai"
DESK = Path("/Users/patricejourdan/Desktop/Moorea-Maitai-ads")
BG = (8, 14, 28)


def fit_contain(src: Image.Image, w: int, h: int) -> Image.Image:
    sw, sh = src.size
    scale = min(w / sw, h / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG)
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def fit_width_center_y(src: Image.Image, w: int, h: int) -> Image.Image:
    """Bandeaux horizontaux : largeur pleine, centré verticalement."""
    sw, sh = src.size
    nh = max(1, int(sh * w / sw))
    if nh <= h:
        resized = src.resize((w, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (w, h), BG)
        canvas.paste(resized, (0, (h - nh) // 2))
        return canvas
    scale = h / sh
    nw = max(1, int(sw * scale))
    resized = src.resize((nw, h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG)
    canvas.paste(resized, ((w - nw) // 2, 0))
    return canvas


def stretch(src: Image.Image, w: int, h: int) -> Image.Image:
    return src.resize((w, h), Image.Resampling.LANCZOS)


EXPORTS: list[tuple[str, str, int, int, str]] = [
    (
        "moorea-maitai-ad-leaderboard-728x90.png",
        "moorea-maitai-06-leaderboard-bottom.png",
        728,
        90,
        "width",
    ),
    (
        "moorea-maitai-ad-billboard-970x250.png",
        "moorea-maitai-01-billboard-top-grande.png",
        970,
        250,
        "stretch",
    ),
    (
        "moorea-maitai-ad-billboard-sunset-970x250.png",
        "moorea-maitai-01-billboard-top-970x250.png",
        970,
        250,
        "stretch",
    ),
    (
        "moorea-maitai-ad-rectangle-300x250.png",
        "moorea-maitai-03-rectangle-coucher-soleil.png",
        300,
        250,
        "contain",
    ),
    (
        "moorea-maitai-ad-rectangle-compact-300x250.png",
        "moorea-maitai-04-rectangle-reserver.png",
        300,
        250,
        "contain",
    ),
    (
        "moorea-maitai-ad-card-300x200.png",
        "moorea-maitai-05-bons-moments-reserver.png",
        300,
        200,
        "contain",
    ),
    (
        "moorea-maitai-ad-ribbon-468x60.png",
        "moorea-maitai-07-ribbon-footer.png",
        468,
        60,
        "width",
    ),
]


def main() -> None:
    for out_name, sep_name, w, h, mode in EXPORTS:
        src_path = SEP / sep_name
        if not src_path.exists():
            print(f"SKIP missing {src_path}")
            continue
        src = Image.open(src_path).convert("RGB")
        if mode == "width":
            out = fit_width_center_y(src, w, h)
        elif mode == "stretch":
            out = stretch(src, w, h)
        else:
            out = fit_contain(src, w, h)

        for base in (OUT, DESK):
            base.mkdir(parents=True, exist_ok=True)
            path = base / out_name
            out.save(path, optimize=True, quality=94)
            print(f"OK {path} ← {sep_name} ({out.size[0]}×{out.size[1]})")


if __name__ == "__main__":
    main()
