#!/usr/bin/env python3
"""
Importe le kit graphique saisonnier MooreaNews (bannières, logos, icônes, décors)
vers public/brand/seasonal/ avec des noms stables pour le web.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ASSETS = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "brand" / "seasonal"

THEMES: list[tuple[str, str]] = [
    ("01-nouvel-an", "nouvel-an"),
    ("02-saint-valentin", "saint-valentin"),
    ("03-paques", "paques"),
    ("04-heiva", "heiva"),
    ("05-baleines", "baleines"),
    ("06-hawaiki-nui", "hawaiki-nui"),
    ("07-rentree-scolaire", "rentree-scolaire"),
    ("08-octobre-rose", "octobre-rose"),
    ("09-coupe-du-monde", "coupe-du-monde"),
    ("10-noel", "noel"),
    ("11-vigilance-meteo", "vigilance-meteo"),
    ("12-anniversaire", "anniversaire"),
]

# Numéro affiché sur la bannière ≠ numéro du fichier Photoshop exporté.
BANNER_FILES: dict[str, str] = {
    "Sans_titre-1-a67df853-00fe-4f0f-a3a7-e82542fbf3de.png": "nouvel-an",
    "Sans_titre-2-725f63a0-1541-49bb-a8a9-5879f14f27ad.png": "paques",
    "Sans_titre-4-107346d5-f4f1-4bce-bf44-d73d3c50259f.png": "heiva",
    "Sans_titre-5-8bffcf8e-0a41-49c5-8e03-d2353f5f3fce.png": "hawaiki-nui",
    "Sans_titre-6-2d219a51-88c6-42b9-8804-45770dc98b80.png": "baleines",
    "Sans_titre-7-028161c4-9f08-429f-aebf-54663eceb3fe.png": "rentree-scolaire",
    "Sans_titre-8-58aef563-4996-441f-a135-97cc9f136b7b.png": "coupe-du-monde",
    "Sans_titre-9-7762ec11-7d5a-4bfa-82ca-e316b0f153d0.png": "octobre-rose",
    "Sans_titre-10-a0e6c06f-1a7b-40d1-a0dc-acba653adae3.png": "vigilance-meteo",
    "Sans_titre-12-edbe60ec-41ba-42a6-a68b-e66e5256e51f.png": "anniversaire",
}
# saint-valentin et noël : bannières absentes des exports (logos seulement).

# Grille 4×3 (logos circulaires numérotés 01–12)
LOGO_GRID = ASSETS / "Sans_titre-14-e5d0b782-07e2-4bc8-85fe-5da38f9a40b0.png"
LOGO_CELLS: list[tuple[int, int, int, int]] = [
    (12, 14, 98, 98),
    (108, 14, 194, 98),
    (204, 14, 290, 98),
    (12, 166, 98, 250),
    (108, 166, 194, 250),
    (204, 166, 290, 250),
    (12, 328, 98, 412),
    (108, 328, 194, 412),
    (204, 328, 290, 412),
    (12, 497, 98, 581),
    (108, 497, 194, 581),
    (204, 497, 290, 581),
]

THEME_ICONS = ASSETS / "Sans_titre-15-cb0bd7c3-9605-45c8-bd87-af0725a1c2de.png"
THEME_ICON_NAMES = [
    "feux-artifice",
    "coeur",
    "coeur-hibiscus",
    "oeuf-paques",
    "oeufs-paques",
    "lapin",
    "carotte",
    "poussin",
    "frangipani",
    "danseuse",
    "tambour",
    "conque",
    "hibiscus-outline",
    "coquillage",
    "poisson",
    "vagues",
    "jumelles",
    "appareil-photo",
    "voilier",
    "rames",
    "trophee",
    "montagnes",
    "crayon",
    "livre",
    "equerre",
    "bus",
    "parapluie",
    "megaphone",
]

DECOR_SPRITE = ASSETS / "Sans_titre-16-549e32a6-ac37-46e6-8c1c-fb8bb082f63c.png"
DECOR_NAMES = [
    "hibiscus-rouge",
    "frangipani-blanc",
    "hibiscus-rose",
    "feuille-monstera",
    "feuille-palmier",
    "feuille-banane",
    "vague",
    "queue-baleine",
    "tortue",
    "vaa",
    "tambour-pahu",
    "ballons",
    "cadeau",
    "ruban-rose",
    "soleil",
    "pluie",
    "orage",
    "tempete",
    "fanions",
]


def is_white(px: tuple[int, ...], thresh: int = 240) -> bool:
    return px[0] > thresh and px[1] > thresh and px[2] > thresh


def split_horizontal_strip(
    src: Image.Image, min_gap: int = 2, min_width: int = 8
) -> list[tuple[int, int]]:
    w, h = src.size
    gaps: list[tuple[int, int]] = []
    start: int | None = None
    for x in range(w):
        if all(is_white(src.getpixel((x, y))) for y in range(h)):
            if start is None:
                start = x
        elif start is not None:
            if x - start >= min_gap:
                gaps.append((start, x - 1))
            start = None
    if start is not None and w - start >= min_gap:
        gaps.append((start, w - 1))

    bounds = [0] + [g[1] + 1 for g in gaps] + [w]
    segments: list[tuple[int, int]] = []
    for i in range(len(bounds) - 1):
        left, right = bounds[i], bounds[i + 1]
        if right - left >= min_width:
            segments.append((left, right))
    return segments


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)


def main() -> None:
    banners_dir = OUT / "banners"
    logos_dir = OUT / "logos"
    icons_dir = OUT / "icons"
    decors_dir = OUT / "decors"

    print(f"→ {OUT}\n")

    for banner_file, slug in BANNER_FILES.items():
        src = Image.open(ASSETS / banner_file).convert("RGBA")
        save_png(src, banners_dir / f"{slug}.png")
        print(f"  bannière  {slug}.png  ({src.size[0]}×{src.size[1]})")

    grid = Image.open(LOGO_GRID).convert("RGBA")
    for (prefix, slug), box in zip(THEMES, LOGO_CELLS, strict=True):
        crop = grid.crop(box)
        save_png(crop, logos_dir / f"{slug}.png")
        print(f"  logo      {slug}.png  ({crop.size[0]}×{crop.size[1]})")

    theme_icons = Image.open(THEME_ICONS).convert("RGBA")
    segments = split_horizontal_strip(theme_icons)
    for i, (left, right) in enumerate(segments):
        name = THEME_ICON_NAMES[i] if i < len(THEME_ICON_NAMES) else f"icon-{i + 1:02d}"
        crop = theme_icons.crop((left, 0, right, theme_icons.size[1]))
        save_png(crop, icons_dir / f"{name}.png")
    print(f"  icônes    {len(segments)} fichiers")

    decors = Image.open(DECOR_SPRITE).convert("RGBA")
    decor_segments = split_horizontal_strip(decors, min_width=20)
  # wide clusters need manual split for row 2
    if len(decor_segments) < len(DECOR_NAMES):
        decor_segments = [
            (0, 60),
            (60, 112),
            (112, 171),
            (171, 230),
            (230, 288),
            (288, 346),
            (346, 404),
            (404, 462),
            (462, 520),
            (520, 578),
            (578, 636),
            (636, 694),
            (694, 752),
            (752, 810),
            (810, 868),
            (868, 926),
            (926, 984),
            (984, 1024),
        ]
    for i, (left, right) in enumerate(decor_segments[: len(DECOR_NAMES)]):
        crop = decors.crop((left, 0, right, decors.size[1]))
        save_png(crop, decors_dir / f"{DECOR_NAMES[i]}.png")
    print(f"  décors    {min(len(decor_segments), len(DECOR_NAMES))} fichiers")

    plumeria = ASSETS / "Sans_titre-13-3e10009b-88cc-4be0-b176-7e1caf2e2e2c.png"
    if plumeria.exists():
        save_png(Image.open(plumeria).convert("RGBA"), decors_dir / "frangipani-extra.png")

    print("\nTerminé.")


if __name__ == "__main__":
    main()
