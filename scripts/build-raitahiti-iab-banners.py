#!/usr/bin/env python3
"""Bannières pub IAB RAI TAHITI — formats identiques à Moorea Maitai."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RT_SITE = Path("/Users/patricejourdan/Desktop/raitahiti-website/public")
LOGO = RT_SITE / "logo.png"
VEHICLE = RT_SITE / "logos/peugeot-traveler.png"
VEHICLE_ALT = RT_SITE / "logos/kia-soul.png"
OUT = ROOT / "public/images/ads/rai-tahiti"
DESK = Path("/Users/patricejourdan/Desktop/Rai-Tahiti-ads")
OUT_RT = Path("/Users/patricejourdan/Desktop/raitahiti-website/public/images/ads/rai-tahiti")

LAGOON = (8, 145, 178)
LAGOON_LIGHT = (34, 211, 238)
OCEAN = (30, 58, 138)
OCEAN_DARK = (15, 23, 42)
CORAL = (225, 29, 72)
WHITE = (255, 255, 255)
MUTED = (203, 213, 225)


def sized(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    p = Path(path)
    if p.exists():
        return ImageFont.truetype(str(p), size, index=index)
    return ImageFont.load_default()


def fonts() -> dict[str, ImageFont.FreeTypeFont | ImageFont.ImageFont]:
    georgia_b = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
    arial = "/Library/Fonts/Arial.ttf"
    arial_b = "/Library/Fonts/Arial Bold.ttf"
    return {
        "title_xl": sized(georgia_b, 42),
        "title_lg": sized(georgia_b, 32),
        "title_md": sized(georgia_b, 24),
        "title_sm": sized(georgia_b, 18),
        "body": sized(arial, 14),
        "body_sm": sized(arial, 12),
        "tiny": sized(arial, 10),
        "micro": sized(arial, 9),
        "bold": sized(arial_b, 13),
        "bold_sm": sized(arial_b, 11),
    }


def save(img: Image.Image, name: str) -> None:
    for base in (OUT, DESK, OUT_RT):
        base.mkdir(parents=True, exist_ok=True)
        path = base / name
        img.save(path, optimize=True, quality=93)
        print(f"OK {path} {img.size[0]}×{img.size[1]}")


def gradient_bg(w: int, h: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line([(0, y), (w, y)], fill=c)
    return img


def load_logo(size: int) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((size, size), Image.Resampling.LANCZOS)
    return logo


def paste_vehicle(
    canvas: Image.Image,
    vehicle_path: Path,
    box: tuple[int, int, int, int],
    opacity: float = 1.0,
) -> None:
    veh = Image.open(vehicle_path).convert("RGBA")
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    veh.thumbnail((bw, bh), Image.Resampling.LANCZOS)
    vw, vh = veh.size
    px = x0 + (bw - vw) // 2
    py = y0 + (bh - vh) // 2
    if opacity < 1:
        alpha = veh.split()[3]
        alpha = alpha.point(lambda a: int(a * opacity))
        veh.putalpha(alpha)
    canvas.paste(veh, (px, py), veh)


def draw_cross(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int) -> None:
    w = max(2, size // 6)
    draw.rectangle((cx - size // 2, cy - w, cx + size // 2, cy + w), fill=CORAL)
    draw.rectangle((cx - w, cy - size // 2, cx + w, cy + size // 2), fill=WHITE)


def build_leaderboard(f: dict) -> Image.Image:
    w, h = 728, 90
    canvas = gradient_bg(w, h, OCEAN_DARK, LAGOON).convert("RGBA")
    paste_vehicle(canvas, VEHICLE, (w - 280, 0, w + 20, h + 30), 0.92)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for x in range(int(w * 0.72)):
        alpha = int(200 * (1 - x / (w * 0.72)))
        od.line([(x, 0), (x, h)], fill=(*OCEAN_DARK, alpha))
    canvas = Image.alpha_composite(canvas, overlay)
    draw = ImageDraw.Draw(canvas)

    logo = load_logo(58)
    canvas.paste(logo, (10, 16), logo)
    draw.text((78, 18), "RAI TAHITI", fill=LAGOON_LIGHT, font=f["title_md"])
    draw.text((78, 46), "Transport sanitaire VSL · Conventionné CPS", fill=WHITE, font=f["body_sm"])

    pill_x, pill_y, pill_w, pill_h = w - 168, 14, 156, 62
    draw.rounded_rectangle((pill_x, pill_y, pill_x + pill_w, pill_y + pill_h), radius=8, fill=(*CORAL, 220))
    draw.text((pill_x + 12, pill_y + 10), "7j/7 · Moorea & Tahiti", fill=WHITE, font=f["bold_sm"])
    draw.text((pill_x + 12, pill_y + 28), "89 77 76 24", fill=WHITE, font=f["body_sm"])
    draw.text((pill_x + 12, pill_y + 44), "89 41 02 10", fill=MUTED, font=f["micro"])

    return canvas.convert("RGB")


def build_ribbon(f: dict) -> Image.Image:
    w, h = 468, 60
    canvas = gradient_bg(w, h, OCEAN, LAGOON).convert("RGBA")
    paste_vehicle(canvas, VEHICLE, (w - 130, -8, w + 10, h + 12), 0.85)
    draw = ImageDraw.Draw(canvas)
    logo = load_logo(44)
    canvas.paste(logo, (8, 8), logo)
    draw.text((58, 14), "RAI TAHITI", fill=WHITE, font=f["title_sm"])
    draw.text((58, 34), "VSL · CPS · Moorea & Tahiti", fill=LAGOON_LIGHT, font=f["micro"])
    draw.text((w - 8, 16), "7j/7", fill=WHITE, font=f["bold_sm"], anchor="ra")
    draw.text((w - 8, 32), "89 77 76 24", fill=WHITE, font=f["micro"], anchor="ra")
    draw.text((w - 8, 46), "raitahiti.com", fill=LAGOON_LIGHT, font=f["micro"], anchor="ra")
    return canvas.convert("RGB")


def build_billboard(f: dict, vehicle: Path, variant: str) -> Image.Image:
    w, h = 970, 250
    top = OCEAN_DARK if variant == "ocean" else (12, 74, 110)
    bottom = LAGOON if variant == "ocean" else (14, 116, 144)
    canvas = gradient_bg(w, h, top, bottom).convert("RGBA")
    paste_vehicle(canvas, vehicle, (w - 420, 20, w + 40, h - 20), 0.95)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for x in range(int(w * 0.58)):
        alpha = int(160 * (1 - x / (w * 0.58)))
        od.line([(x, 0), (x, h)], fill=(*OCEAN_DARK, alpha))
    canvas = Image.alpha_composite(canvas, overlay)
    draw = ImageDraw.Draw(canvas)

    logo = load_logo(72)
    canvas.paste(logo, (24, 24), logo)
    draw.text((108, 28), "RAI TAHITI", fill=WHITE, font=f["title_xl"])
    draw.text(
        (108, 78),
        "Transport sanitaire VSL — Conventionné C.P.S.",
        fill=LAGOON_LIGHT,
        font=f["body"],
    )
    draw.text(
        (108, 102),
        "Moorea · Tahiti · Pihaena PK 14,5 · Depuis 2013",
        fill=MUTED,
        font=f["body_sm"],
    )

    tags = [
        "Ambulance & VSL",
        "7j/7",
        "Moorea 89 77 76 24",
        "Tahiti 89 41 02 10",
        "raitahiti.com",
    ]
    y = h - 44
    x = 24
    for i, tag in enumerate(tags):
        color = CORAL if i == 0 else (LAGOON_LIGHT if i >= 3 else WHITE)
        draw.text((x, y), tag, fill=color, font=f["bold_sm"] if i in (0, 2, 3) else f["body_sm"])
        x += int(draw.textlength(tag, font=f["body_sm"])) + 20

    draw.rounded_rectangle((24, 138, 54, 168), radius=4, fill=CORAL)
    draw_cross(draw, 39, 153, 22)

    return canvas.convert("RGB")


def build_rectangle(f: dict, compact: bool = False) -> Image.Image:
    w, h = 300, 250
    header_h = 118 if compact else 128
    canvas = gradient_bg(w, h, OCEAN_DARK, LAGOON)
    draw = ImageDraw.Draw(canvas)

    sub = Image.new("RGBA", (w, header_h), (0, 0, 0, 0))
    paste_vehicle(sub, VEHICLE if not compact else VEHICLE_ALT, (120, 0, w + 10, header_h + 10), 0.9)
    canvas.paste(sub.convert("RGB"), (0, 0))

    logo = load_logo(48)
    canvas.paste(logo, (12, header_h + 8), logo)
    draw.text((68, header_h + 12), "RAI TAHITI", fill=WHITE, font=f["title_sm"])
    draw.text((68, header_h + 34), "Transport sanitaire VSL", fill=LAGOON_LIGHT, font=f["tiny"])

    if compact:
        draw.text((12, header_h + 62), "Conventionné CPS · 7j/7", fill=WHITE, font=f["tiny"])
        draw.text((12, header_h + 78), "Moorea & Tahiti", fill=MUTED, font=f["micro"])
        draw.text((12, header_h + 98), "89 77 76 24", fill=CORAL, font=f["bold"])
        draw.text((12, header_h + 116), "89 41 02 10", fill=WHITE, font=f["tiny"])
    else:
        draw.text((12, header_h + 62), "Ambulance · VSL · CPS", fill=WHITE, font=f["body_sm"])
        draw.text((12, header_h + 82), "Disponible 7j/7", fill=MUTED, font=f["tiny"])
        draw.text((12, header_h + 100), "Moorea : 89 77 76 24", fill=CORAL, font=f["bold_sm"])
        draw.text((12, header_h + 118), "Tahiti : 89 41 02 10", fill=WHITE, font=f["body_sm"])
        draw.text((12, header_h + 138), "www.raitahiti.com", fill=LAGOON_LIGHT, font=f["tiny"])

    return canvas


def build_card(f: dict) -> Image.Image:
    w, h = 300, 200
    canvas = gradient_bg(w, h, OCEAN, LAGOON)
    sub = Image.new("RGBA", (w, 95), (0, 0, 0, 0))
    paste_vehicle(sub, VEHICLE, (130, -5, w + 5, 100), 0.88)
    canvas.paste(sub.convert("RGB"), (0, 0))
    draw = ImageDraw.Draw(canvas)

    logo = load_logo(40)
    canvas.paste(logo, (10, 102), logo)
    draw.text((56, 106), "RAI TAHITI", fill=WHITE, font=f["title_sm"])
    draw.text((56, 126), "VSL · CPS · 7j/7", fill=LAGOON_LIGHT, font=f["micro"])
    draw.text((10, 152), "Moorea 89 77 76 24", fill=CORAL, font=f["bold_sm"])
    draw.text((10, 170), "Tahiti 89 41 02 10", fill=WHITE, font=f["tiny"])
    return canvas


def main() -> None:
    if not LOGO.exists():
        raise SystemExit(f"Logo introuvable : {LOGO}")
    f = fonts()

    save(build_leaderboard(f), "rai-tahiti-ad-leaderboard-728x90.png")
    save(build_billboard(f, VEHICLE, "default"), "rai-tahiti-ad-billboard-970x250.png")
    save(build_billboard(f, VEHICLE_ALT, "ocean"), "rai-tahiti-ad-billboard-ocean-970x250.png")
    save(build_rectangle(f, compact=False), "rai-tahiti-ad-rectangle-300x250.png")
    save(build_rectangle(f, compact=True), "rai-tahiti-ad-rectangle-compact-300x250.png")
    save(build_card(f), "rai-tahiti-ad-card-300x200.png")
    save(build_ribbon(f), "rai-tahiti-ad-ribbon-468x60.png")


if __name__ == "__main__":
    main()
