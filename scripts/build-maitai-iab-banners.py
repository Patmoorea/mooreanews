#!/usr/bin/env python3
"""Bannières pub IAB Moorea Maitai — mise en page par format, pas simple redimensionnement."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path("/Users/patricejourdan/Desktop/moorea-hub")
MASTER = ROOT / "public/images/restaurants/moorea-maitai-banniere-facebook.png"
COVER = ROOT / "public/images/restaurants/moorea-maitai-banniere-facebook.png"
OUT = ROOT / "public/images/ads/moorea-maitai"
DESK = Path("/Users/patricejourdan/Desktop/Moorea-Maitai-ads")

GOLD = (212, 175, 55)
GOLD_LIGHT = (240, 210, 120)
WHITE = (255, 255, 255)
DARK = (12, 18, 32)
DARK_TRANS = (12, 18, 32, 210)


def fonts() -> dict[str, ImageFont.FreeTypeFont | ImageFont.ImageFont]:
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    bold_candidates = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    serif = ImageFont.load_default()
    serif_bold = ImageFont.load_default()
    sans = ImageFont.load_default()
    for p in candidates:
        if Path(p).exists():
            serif = ImageFont.truetype(p, 24)
            break
    for p in bold_candidates:
        if Path(p).exists():
            serif_bold = ImageFont.truetype(p, 24)
            break
    for p in candidates:
        if Path(p).exists():
            sans = ImageFont.truetype(p, 14)
            break
    return {"serif": serif, "serif_bold": serif_bold, "sans": sans}


def sized(font_path: str, size: int) -> ImageFont.FreeTypeFont:
    if Path(font_path).exists():
        return ImageFont.truetype(font_path, size)
    return ImageFont.load_default()


def font_set() -> dict[str, ImageFont.FreeTypeFont | ImageFont.ImageFont]:
    georgia = "/System/Library/Fonts/Supplemental/Georgia.ttf"
    georgia_b = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
    arial = "/Library/Fonts/Arial.ttf"
    return {
        "title_xl": sized(georgia_b, 42),
        "title_lg": sized(georgia_b, 32),
        "title_md": sized(georgia_b, 24),
        "title_sm": sized(georgia_b, 20),
        "body": sized(arial, 16),
        "body_sm": sized(arial, 13),
        "tiny": sized(arial, 11),
        "micro": sized(arial, 9),
    }


def save(img: Image.Image, name: str) -> None:
    for base in (OUT, DESK):
        base.mkdir(parents=True, exist_ok=True)
        path = base / name
        img.save(path, optimize=True, quality=93)
        print(f"OK {path} {img.size}")


def crop_cover_region(cover: Image.Image, box_ratio: float, y_center: float = 0.55) -> Image.Image:
    """Recadre une zone paysage du visuel couverture."""
    sw, sh = cover.size
    crop_h = int(sh * 0.55)
    crop_w = int(crop_h * box_ratio)
    crop_w = min(crop_w, sw)
    cy = int(sh * y_center)
    top = max(0, cy - crop_h // 2)
    bottom = min(sh, top + crop_h)
    top = bottom - crop_h
    left = max(0, (sw - crop_w) // 2)
    return cover.crop((left, top, left + crop_w, bottom))


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


def extract_logo(master: Image.Image, size: int) -> Image.Image:
    """Logo MM depuis la bannière maîtresse."""
    badge = master.crop((36, 28, 210, 202)).resize((size, size), Image.Resampling.LANCZOS)
    return badge


def gradient_overlay(w: int, h: int, side: str = "left", width_ratio: float = 0.55) -> Image.Image:
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    zone = int(w * width_ratio)
    for x in range(zone):
        if side == "left":
            alpha = int(220 * (1 - x / zone))
            draw.line([(x, 0), (x, h)], fill=(*DARK[:3], alpha))
        else:
            alpha = int(180 * (x - (w - zone)) / zone) if x >= w - zone else 0
            if alpha > 0:
                draw.line([(x, 0), (x, h)], fill=(*DARK[:3], alpha))
    return overlay


def draw_mm_badge(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int) -> None:
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=DARK, outline=GOLD, width=max(2, r // 18))
    f = sized("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", int(r * 0.9))
    draw.text((cx, cy), "MM", fill=GOLD, font=f, anchor="mm")


def build_leaderboard(cover: Image.Image, master: Image.Image, f: dict) -> Image.Image:
    w, h = 728, 90
    photo = fit_cover(crop_cover_region(cover, 3.2, 0.58), w, h)
    canvas = photo.convert("RGBA")
    canvas = Image.alpha_composite(canvas, gradient_overlay(w, h, "left", 0.62))
    canvas = Image.alpha_composite(canvas, gradient_overlay(w, h, "right", 0.28))

    draw = ImageDraw.Draw(canvas, "RGBA")
    logo = extract_logo(master, 64)
    canvas.paste(logo, (12, 13), logo if logo.mode == "RGBA" else None)

    draw.text((88, 22), "MOOREA MAITAI", fill=GOLD_LIGHT, font=sized("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 26))
    draw.text((88, 50), "Snack Bar · Sunset Beach Maharepa", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 14))

    pill_w, pill_h = 148, 58
    pill_x, pill_y = w - pill_w - 8, (h - pill_h) // 2
    draw.rounded_rectangle(
        (pill_x, pill_y, pill_x + pill_w, pill_y + pill_h),
        radius=8,
        fill=(0, 0, 0, 175),
    )
    draw.text((w - 16, 30), "7/7 11h-21h", fill=GOLD, font=sized("/Library/Fonts/Arial Bold.ttf", 15), anchor="ra")
    draw.text((w - 16, 52), "87 27 19 19", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 13), anchor="ra")

    return canvas.convert("RGB")


def build_ribbon(cover: Image.Image, master: Image.Image) -> Image.Image:
    w, h = 468, 60
    photo = fit_cover(crop_cover_region(cover, 4.5, 0.62), w, h)
    canvas = photo.convert("RGBA")
    canvas = Image.alpha_composite(canvas, gradient_overlay(w, h, "left", 0.7))
    draw = ImageDraw.Draw(canvas)

    draw_mm_badge(draw, 28, 30, 22)
    draw.text((58, 18), "MOOREA MAITAI", fill=GOLD_LIGHT, font=sized("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 16))
    draw.text((58, 36), "Sunset Beach · Maharepa", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 10))
    draw.text((w - 10, 22), "7/7 11h-21h", fill=GOLD, font=sized("/Library/Fonts/Arial Bold.ttf", 10), anchor="ra")
    draw.text((w - 10, 38), "87 27 19 19", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 9), anchor="ra")
    return canvas.convert("RGB")


def build_billboard(cover: Image.Image, master: Image.Image) -> Image.Image:
    w, h = 970, 250
    photo = fit_cover(crop_cover_region(cover, 2.8, 0.55), w, h - 56)
    canvas = Image.new("RGB", (w, h), DARK)
    canvas.paste(photo, (0, 0))

    header = Image.new("RGBA", (w, 56), DARK_TRANS)
    canvas.paste(header, (0, 0), header)
    footer = Image.new("RGBA", (w, 56), (0, 0, 0, 230))
    canvas.paste(footer, (0, h - 56), footer)

    draw = ImageDraw.Draw(canvas)
    logo = extract_logo(master, 46)
    canvas.paste(logo, (16, 5), logo if logo.mode == "RGBA" else None)

    draw.text((74, 10), "MOOREA MAITAI", fill=GOLD_LIGHT, font=sized("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 30))
    draw.text((74, 38), "Snack Bar · Bar & Grill — Sunset Beach, Maharepa", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 15))

    tags = ["Cuisine locale", "Tapas", "Grillades", "Fruits de mer", "7/7 11h-21h", "87 27 19 19"]
    x = 20
    y = h - 38
    for i, tag in enumerate(tags):
        draw.text((x, y), tag, fill=GOLD if i >= 4 else WHITE, font=sized("/Library/Fonts/Arial.ttf", 13))
        x += draw.textlength(tag, font=sized("/Library/Fonts/Arial.ttf", 13)) + 22
        if i == 3:
            draw.line([(x - 11, y - 2), (x - 11, y + 16)], fill=GOLD, width=1)

    return canvas


def build_rectangle(cover: Image.Image, master: Image.Image) -> Image.Image:
    w, h = 300, 250
    photo_h = 155
    photo = fit_cover(crop_cover_region(cover, 1.1, 0.55), w, photo_h)
    canvas = Image.new("RGB", (w, h), DARK)
    canvas.paste(photo, (0, 0))

    draw = ImageDraw.Draw(canvas)
    logo = extract_logo(master, 52)
    canvas.paste(logo, (12, photo_h + 8), logo if logo.mode == "RGBA" else None)

    draw.text((74, photo_h + 14), "MOOREA MAITAI", fill=GOLD_LIGHT, font=sized("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 18))
    draw.text((74, photo_h + 36), "Snack Bar · Maharepa", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 11))
    draw.text((16, photo_h + 72), "Cuisine locale · Tapas · Grillades", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 11))
    draw.text((16, photo_h + 90), "Fruits de mer", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 11))
    draw.text((16, photo_h + 118), "7/7 11h-21h  ·  87 27 19 19", fill=GOLD, font=sized("/Library/Fonts/Arial Bold.ttf", 13))
    return canvas


def build_card(cover: Image.Image, master: Image.Image) -> Image.Image:
    w, h = 300, 200
    photo_h = 120
    photo = fit_cover(crop_cover_region(cover, 1.2, 0.55), w, photo_h)
    canvas = Image.new("RGB", (w, h), DARK)
    canvas.paste(photo, (0, 0))

    draw = ImageDraw.Draw(canvas)
    logo = extract_logo(master, 40)
    canvas.paste(logo, (10, photo_h + 6), logo if logo.mode == "RGBA" else None)
    draw.text((58, photo_h + 10), "MOOREA MAITAI", fill=GOLD_LIGHT, font=sized("/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 16))
    draw.text((58, photo_h + 30), "Sunset Beach · Maharepa", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 10))
    draw.text((12, photo_h + 58), "Tapas · Grillades · Fruits de mer", fill=WHITE, font=sized("/Library/Fonts/Arial.ttf", 10))
    draw.text((12, photo_h + 76), "7/7 11h-21h  ·  87 27 19 19", fill=GOLD, font=sized("/Library/Fonts/Arial Bold.ttf", 11))
    return canvas


def main() -> None:
    master = Image.open(MASTER).convert("RGBA")
    cover = Image.open(COVER).convert("RGB")
    f = font_set()

    save(build_leaderboard(cover, master, f), "moorea-maitai-ad-leaderboard-728x90.png")
    save(build_billboard(cover, master), "moorea-maitai-ad-billboard-970x250.png")
    save(build_rectangle(cover, master), "moorea-maitai-ad-rectangle-300x250.png")
    save(build_card(cover, master), "moorea-maitai-ad-card-300x200.png")
    save(build_ribbon(cover, master), "moorea-maitai-ad-ribbon-468x60.png")


if __name__ == "__main__":
    main()
