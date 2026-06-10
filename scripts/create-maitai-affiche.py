#!/usr/bin/env python3
"""Affiche Moorea Maitai à partir des photos réelles du lieu."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS = Path(
    "/Users/patricejourdan/.cursor/projects/Users-patricejourdan-Desktop-moorea-hub/assets"
)
OUT_DESK = Path("/Users/patricejourdan/Desktop")
OUT_PROJ = Path("/Users/patricejourdan/Desktop/moorea-hub/public/images/restaurants")

FONT_SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
FONT_SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"
FONT_SCRIPT = "/System/Library/Fonts/Supplemental/SnellRoundhand.ttc"
FONT_SANS = "/System/Library/Fonts/Helvetica.ttc"


def load_font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size, index=index)


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def draw_centered(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, ...],
    width: int,
    shadow: bool = True,
) -> None:
    tw, _ = text_size(draw, text, font)
    x = (width - tw) // 2
    if shadow:
        draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 120))
    draw.text((x, y), text, font=font, fill=fill)


def draw_with_shadow(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, ...],
) -> None:
    x, y = xy
    draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 140))
    draw.text((x, y), text, font=font, fill=fill)


def affiche_journee(src: Path, dst: Path) -> None:
    """Photo plage / parasol rouge — style affiche ouverture."""
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Bandeau haut léger pour lisibilité
    for i in range(180):
        alpha = int(140 * (1 - i / 180))
        draw.line([(0, i), (w, i)], fill=(0, 0, 0, alpha))

    # Bandeau bas
    for i in range(220):
        y = h - 220 + i
        alpha = int(160 * (i / 220))
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))

    composed = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(composed)

    title = load_font(FONT_SERIF_BOLD, 72)
    subtitle = load_font(FONT_SERIF, 34)
    open_font = load_font(FONT_SANS, 88, index=1)
    script = load_font(FONT_SCRIPT, 52, index=0)
    phone = load_font(FONT_SANS, 36, index=0)

    draw_centered(draw, "MOOREA MAITAI", 28, title, (255, 255, 255, 255), w)
    draw_centered(draw, "Snack Bar · Bar & Grill", 108, subtitle, (255, 255, 255, 230), w, shadow=False)
    draw_centered(draw, "Sunset Beach · Maharepa", 152, subtitle, (255, 230, 180, 255), w)

    draw_with_shadow(draw, (48, h - 200), "OPEN", open_font, (255, 255, 255, 255))
    draw_with_shadow(draw, (48, h - 108), "Tous les jours", script, (255, 255, 255, 255))
    draw_with_shadow(draw, (48, h - 58), "11h00 - 21h00", script, (255, 255, 255, 255))

    phone_text = "(689) 87.27.19.19"
    pw, _ = text_size(draw, phone_text, phone)
    draw_with_shadow(draw, (w - pw - 48, h - 72), phone_text, phone, (255, 255, 255, 255))

    composed.convert("RGB").save(dst, quality=95)


def affiche_sunset(src: Path, dst: Path) -> None:
    """Photo coucher de soleil — même style que l'affiche existante."""
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Masquer ancien texte haut
    draw.rectangle([(0, 0), (w, 130)], fill=(0, 0, 0, 0))
    for i in range(130):
        alpha = int(100 * (1 - i / 130))
        draw.line([(0, i), (w, i)], fill=(0, 0, 0, alpha))

    # Masquer ancien texte bas
    draw.rectangle([(0, h - 250), (w, h)], fill=(0, 0, 0, 90))

    composed = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(composed)

    title = load_font(FONT_SERIF_BOLD, 68)
    open_font = load_font(FONT_SANS, 82, index=1)
    script = load_font(FONT_SCRIPT, 48, index=0)
    phone = load_font(FONT_SANS, 34, index=0)

    draw_centered(draw, "MOOREA MAITAI", 22, title, (255, 255, 255, 255), w)
    draw_with_shadow(draw, (40, h - 210), "OPEN", open_font, (255, 255, 255, 255))
    draw_with_shadow(draw, (40, h - 118), "Tous les jours", script, (255, 255, 255, 255))
    draw_with_shadow(draw, (40, h - 68), "11h00 - 21h00", script, (255, 255, 255, 255))

    phone_text = "(689) 87.27.19.19"
    pw, _ = text_size(draw, phone_text, phone)
    draw_with_shadow(draw, (w - pw - 40, h - 72), phone_text, phone, (255, 255, 255, 255))

    composed.convert("RGB").save(dst, quality=95)


def affiche_soir(src: Path, dst: Path) -> None:
    """Photo soirée / guirlandes — style bandeau crème en haut."""
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Bandeau crème haut (comme affiche originale)
    draw.rectangle([(0, 0), (w, 115)], fill=(245, 240, 230, 245))

    # Masquer ancien texte bas
    draw.rectangle([(0, h - 200), (w, h)], fill=(0, 0, 0, 100))

    composed = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(composed)

    title = load_font(FONT_SERIF_BOLD, 62)
    hours1 = load_font(FONT_SERIF_BOLD, 52)
    hours2 = load_font(FONT_SERIF_BOLD, 52)
    loc = load_font(FONT_SERIF, 30)

    draw_centered(draw, "MOOREA MAITAI", 28, title, (20, 20, 20, 255), w, shadow=False)
    draw_centered(draw, "LUNDI AU DIMANCHE", h - 165, hours1, (255, 255, 255, 255), w)
    draw_centered(draw, "11h00 - 21h00", h - 100, hours2, (255, 255, 255, 255), w)
    draw_centered(draw, "Maharepa · à côté du Manava", h - 48, loc, (255, 255, 255, 220), w, shadow=False)

    composed.convert("RGB").save(dst, quality=95)


def facebook_cover(src: Path, dst: Path) -> None:
    """Couverture Facebook 1640x624 depuis photo sunset."""
    img = Image.open(src).convert("RGB")
    w, h = img.size
    target_w, target_h = 1640, 624
    ratio = target_w / target_h

    # Recadrage centré sur la terrasse
    crop_w = min(w, int(h * ratio))
    crop_h = int(crop_w / ratio)
    left = (w - crop_w) // 2
    top = int(h * 0.15)
    cropped = img.crop((left, top, left + crop_w, top + crop_h))
    cover = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for i in range(120):
        alpha = int(120 * (1 - i / 120))
        draw.line([(0, i), (target_w, i)], fill=(0, 0, 0, alpha))
    for i in range(100):
        y = target_h - 100 + i
        alpha = int(130 * (i / 100))
        draw.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    cover = Image.alpha_composite(cover.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(cover)

    title = load_font(FONT_SERIF_BOLD, 58)
    script = load_font(FONT_SCRIPT, 36, index=0)
    sans = load_font(FONT_SANS, 26, index=0)

    draw_centered(draw, "MOOREA MAITAI", 18, title, (255, 255, 255, 255), target_w)
    draw_centered(draw, "Snack Bar · Sunset Beach · Maharepa", 82, sans, (255, 255, 255, 230), target_w, shadow=False)

    draw_with_shadow(draw, (40, target_h - 78), "Tous les jours 11h-21h", script, (255, 255, 255, 255))
    phone_text = "87 27 19 19"
    pw, _ = text_size(draw, phone_text, sans)
    draw_with_shadow(draw, (target_w - pw - 40, target_h - 68), phone_text, sans, (255, 255, 255, 255))

    cover.convert("RGB").save(dst, quality=95)


def main() -> None:
    photo_jour = ASSETS / "472383758_122187241958179263_2289912651526158519_n-a6492e8b-e145-4fd5-aab8-d98292997bbb.png"
    photo_sunset = ASSETS / "480688840_122196612884179263_1274388804539138788_n-a337e670-a248-4d9e-bf08-d4b24038d9e6.png"
    photo_soir = ASSETS / "619591235_122251255328179263_7314860585302983820_n-95fa5675-1ed6-4036-8065-96d38b8b461a.png"

    OUT_DESK.mkdir(parents=True, exist_ok=True)
    OUT_PROJ.mkdir(parents=True, exist_ok=True)

    outputs = [
        ("Moorea-Maitai-affiche-plage.png", lambda p: affiche_journee(photo_jour, p)),
        ("Moorea-Maitai-affiche-sunset.png", lambda p: affiche_sunset(photo_sunset, p)),
        ("Moorea-Maitai-affiche-soir.png", lambda p: affiche_soir(photo_soir, p)),
        ("Moorea-Maitai-banniere-facebook-cover.png", lambda p: facebook_cover(photo_sunset, p)),
    ]

    for name, fn in outputs:
        desk = OUT_DESK / name
        proj = OUT_PROJ / name.replace("Moorea-Maitai-", "moorea-maitai-").lower()
        fn(desk)
        fn(proj)
        print(f"OK {desk} ({desk.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
