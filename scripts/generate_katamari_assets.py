from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


OUT = Path(__file__).resolve().parents[1] / "site" / "assets" / "img"
SCALE = 4


def canvas(size: tuple[int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (size[0] * SCALE, size[1] * SCALE), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def p(points):
    return [(int(x * SCALE), int(y * SCALE)) for x, y in points]


def b(box):
    x0, y0, x1, y1 = box
    return tuple(int(v * SCALE) for v in (x0, y0, x1, y1))


def save(img: Image.Image, name: str, size: tuple[int, int]) -> None:
    img = img.resize(size, Image.Resampling.LANCZOS)
    img.save(OUT / name)


def ellipse(d, box, fill):
    d.ellipse(b(box), fill=fill)


def pieslice(d, box, start, end, fill):
    d.pieslice(b(box), start=start, end=end, fill=fill)


def polygon(d, points, fill):
    d.polygon(p(points), fill=fill)


def line(d, points, fill, width, joint="curve"):
    d.line(p(points), fill=fill, width=max(1, int(width * SCALE)), joint=joint)


def regular_star(cx, cy, r_outer, r_inner, rotation=-90):
    pts = []
    for i in range(10):
        r = r_outer if i % 2 == 0 else r_inner
        a = math.radians(rotation + i * 36)
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def facet_star(d, cx, cy, color, shadow, light, r_outer=100, r_inner=45):
    pts = regular_star(cx, cy, r_outer, r_inner)
    polygon(d, pts, color)
    polygon(d, [pts[0], pts[1], (cx, cy), pts[9]], light)
    polygon(d, [pts[2], pts[3], (cx, cy), pts[4]], shadow)
    polygon(d, [pts[5], pts[6], (cx, cy), pts[7]], shadow)
    polygon(d, [pts[8], pts[9], (cx, cy), pts[0]], light)


def eye(d, cx, cy, r=25, pupil=14, look=(-3, -2)):
    ellipse(d, (cx - r, cy - r, cx + r, cy + r), (255, 255, 250, 255))
    ellipse(
        d,
        (cx + look[0] - pupil, cy + look[1] - pupil, cx + look[0] + pupil, cy + look[1] + pupil),
        (40, 34, 38, 255),
    )
    ellipse(d, (cx + 5, cy - 13, cx + 13, cy - 5), (255, 255, 255, 255))


def cheek(d, cx, cy, r=18):
    ellipse(d, (cx - r, cy - r, cx + r, cy + r), (255, 132, 174, 235))


def smile_open(d, x, y, w=34, h=24):
    pieslice(d, (x, y, x + w, y + h), 0, 180, (164, 32, 70, 255))
    pieslice(d, (x + 8, y + 11, x + w - 4, y + h + 7), 180, 360, (255, 108, 121, 255))


def fish_base(name, body, shadow, belly=None, stripes=None, dots=None, eye_style="round", mouth="open", shape="oval"):
    img, d = canvas((512, 512))
    if shape == "puffer":
        ellipse(d, (118, 112, 398, 392), body)
        for tx, ty in [(112, 164), (104, 244), (122, 328), (390, 164), (408, 246), (384, 326)]:
            polygon(d, [(tx, ty), (tx + 24, ty + 12), (tx + 2, ty + 28)], shadow)
    elif shape == "slim":
        ellipse(d, (74, 172, 414, 320), body)
    else:
        ellipse(d, (82, 138, 408, 346), body)
    polygon(d, [(390, 250), (474, 172), (452, 250), (474, 332)], shadow)
    polygon(d, [(236, 160), (304, 96), (324, 178)], shadow)
    polygon(d, [(238, 326), (310, 388), (326, 312)], shadow)
    if belly:
        pieslice(d, (76, 198, 402, 374), 0, 180, belly)
    if stripes:
        for sx, sy, ex, ey in stripes:
            line(d, [(sx, sy), (ex, ey)], shadow, 15)
    if dots:
        for cx, cy, r in dots:
            ellipse(d, (cx - r, cy - r, cx + r, cy + r), (255, 245, 244, 255))
    if eye_style == "closed":
        line(d, [(145, 220), (173, 236), (202, 220)], (45, 37, 43, 255), 8)
        line(d, [(225, 220), (253, 236), (282, 220)], (45, 37, 43, 255), 8)
    elif eye_style == "star":
        facet_star(d, 158, 213, (255, 222, 63, 255), (232, 148, 37, 255), (255, 242, 112, 255), 28, 13)
        facet_star(d, 232, 213, (255, 222, 63, 255), (232, 148, 37, 255), (255, 242, 112, 255), 28, 13)
    else:
        eye(d, 158, 212, 29, 16)
        eye(d, 234, 212, 29, 16)
    cheek(d, 128, 264)
    cheek(d, 271, 264)
    if mouth == "closed":
        line(d, [(178, 278), (202, 292), (228, 276)], (147, 28, 66, 255), 7)
    elif eye_style == "closed":
        line(d, [(172, 278), (196, 292), (222, 278)], (147, 28, 66, 255), 7)
    else:
        smile_open(d, 176, 263, 45, 34)
    save(img, name, (512, 512))


def generate_fish():
    fish_base(
        "fish-orange.png",
        (255, 145, 43, 255),
        (232, 99, 31, 255),
        stripes=[(318, 158, 350, 208), (360, 171, 388, 224), (326, 294, 374, 326)],
    )
    fish_base(
        "fish-pink.png",
        (255, 124, 176, 255),
        (216, 82, 145, 255),
        dots=[(232, 162, 12), (304, 204, 13), (260, 292, 12), (342, 274, 10)],
        shape="puffer",
    )
    fish_base(
        "fish-teal.png",
        (34, 184, 177, 255),
        (22, 132, 143, 255),
        stripes=[(226, 178, 226, 316), (286, 174, 286, 316), (348, 186, 348, 306)],
        eye_style="closed",
        shape="slim",
    )
    fish_base(
        "fish-purple.png",
        (144, 95, 207, 255),
        (100, 72, 166, 255),
        belly=(255, 183, 205, 255),
        eye_style="star",
        mouth="closed",
        shape="slim",
    )
    fish_base(
        "fish-yellow.png",
        (255, 211, 49, 255),
        (236, 155, 35, 255),
        stripes=[(292, 176, 376, 186), (278, 236, 400, 238), (286, 292, 378, 278)],
        mouth="closed",
    )


def generate_anglerfish():
    img, d = canvas((768, 512))
    ellipse(d, (94, 132, 610, 388), (73, 61, 103, 255))
    pieslice(d, (95, 152, 525, 418), 0, 180, (45, 44, 74, 255))
    polygon(d, [(578, 258), (710, 156), (680, 258), (710, 366)], (53, 49, 82, 255))
    polygon(d, [(294, 140), (378, 72), (408, 150)], (96, 75, 132, 255))
    polygon(d, [(278, 378), (390, 432), (418, 352)], (53, 49, 82, 255))
    pieslice(d, (122, 214, 430, 376), 10, 175, (25, 22, 36, 255))
    for x in range(150, 398, 34):
        polygon(d, [(x, 235), (x + 17, 286), (x + 34, 236)], (255, 248, 220, 255))
    for x in range(168, 394, 38):
        polygon(d, [(x, 362), (x + 17, 315), (x + 34, 360)], (255, 248, 220, 255))
    eye(d, 280, 184, 42, 24, (-4, -2))
    line(d, [(318, 138), (340, 82), (395, 56), (438, 80)], (80, 62, 107, 255), 10)
    ellipse(d, (422, 58, 482, 118), (255, 231, 74, 255))
    ellipse(d, (435, 70, 467, 102), (255, 251, 148, 255))
    for cx, cy, r in [(500, 54, 8), (464, 34, 5), (510, 108, 6), (415, 122, 5)]:
        facet_star(d, cx, cy, (255, 234, 94, 255), (238, 167, 45, 255), (255, 249, 160, 255), r, max(3, r // 2))
    save(img, "anglerfish.png", (768, 512))


def generate_rod():
    img, d = canvas((256, 512))
    curve = [(72, 470), (68, 390), (86, 300), (112, 218), (148, 128), (202, 42)]
    for w, col in [(16, (82, 57, 44, 255)), (9, (42, 48, 55, 255)), (5, (87, 75, 66, 255))]:
        line(d, curve, col, w)
    line(d, [(62, 500), (68, 456), (74, 412), (82, 368)], (176, 119, 68, 255), 24)
    line(d, [(62, 500), (68, 456), (74, 412), (82, 368)], (215, 166, 92, 255), 12)
    ellipse(d, (46, 356, 104, 414), (42, 38, 43, 255))
    ellipse(d, (61, 371, 89, 399), (231, 178, 68, 255))
    line(d, [(82, 360), (92, 336)], (229, 177, 76, 255), 9)
    for cx, cy, col in [
        (90, 312, (255, 118, 174, 255)),
        (110, 242, (39, 190, 184, 255)),
        (137, 170, (145, 97, 211, 255)),
        (172, 100, (255, 214, 52, 255)),
        (202, 44, (255, 143, 45, 255)),
    ]:
        ellipse(d, (cx - 10, cy - 10, cx + 10, cy + 10), col)
        ellipse(d, (cx - 4, cy - 4, cx + 4, cy + 4), (255, 249, 230, 255))
    save(img, "rod.png", (256, 512))


def generate_stars():
    colors = {
        "star-yellow.png": ((255, 220, 55, 255), (231, 151, 38, 255), (255, 243, 106, 255)),
        "star-pink.png": ((255, 119, 174, 255), (213, 72, 139, 255), (255, 166, 201, 255)),
        "star-teal.png": ((38, 190, 184, 255), (20, 130, 147, 255), (104, 224, 211, 255)),
        "star-purple.png": ((143, 96, 211, 255), (93, 70, 164, 255), (184, 141, 237, 255)),
        "star-orange.png": ((255, 151, 46, 255), (225, 88, 31, 255), (255, 189, 88, 255)),
    }
    for name, (main, shadow, light) in colors.items():
        img, d = canvas((256, 256))
        facet_star(d, 128, 130, main, shadow, light)
        save(img, name, (256, 256))


def generate_moon_sun():
    img, d = canvas((256, 256))
    ellipse(d, (38, 34, 220, 220), (255, 221, 76, 255))
    ellipse(d, (138, 58, 172, 92), (236, 175, 56, 255))
    ellipse(d, (68, 146, 100, 176), (236, 175, 56, 255))
    ellipse(d, (162, 154, 198, 190), (236, 175, 56, 255))
    eye(d, 94, 108, 20, 11)
    eye(d, 154, 108, 20, 11)
    cheek(d, 76, 146, 13)
    cheek(d, 176, 146, 13)
    line(d, [(105, 154), (126, 168), (149, 154)], (150, 45, 69, 255), 6)
    save(img, "moon.png", (256, 256))

    img, d = canvas((512, 512))
    cx, cy = 256, 256
    for i in range(24):
        a = math.radians(i * 15)
        color = (255, 213, 51, 255) if i % 2 == 0 else (255, 145, 40, 255)
        r1, r2 = 164, 236 if i % 2 == 0 else 214
        da = math.radians(5.5)
        polygon(
            d,
            [
                (cx + math.cos(a - da) * r1, cy + math.sin(a - da) * r1),
                (cx + math.cos(a) * r2, cy + math.sin(a) * r2),
                (cx + math.cos(a + da) * r1, cy + math.sin(a + da) * r1),
            ],
            color,
        )
    ellipse(d, (96, 96, 416, 416), (255, 219, 58, 255))
    pieslice(d, (224, 96, 414, 286), 270, 90, (255, 184, 45, 255))
    eye(d, 202, 230, 34, 19)
    eye(d, 310, 230, 34, 19)
    cheek(d, 170, 292, 22)
    cheek(d, 338, 292, 22)
    line(d, [(222, 310), (256, 336), (294, 310)], (154, 43, 69, 255), 9)
    save(img, "sun.png", (512, 512))


def generate_clouds():
    specs = {
        "cloud-1.png": [(80, 112, 236, 220), (174, 66, 346, 218), (300, 112, 452, 220)],
        "cloud-2.png": [(40, 118, 178, 226), (128, 72, 270, 218), (238, 70, 388, 226), (344, 126, 486, 226)],
        "cloud-3.png": [(92, 116, 262, 220), (224, 84, 404, 220)],
    }
    for name, ellipses in specs.items():
        img, d = canvas((512, 256))
        for e in ellipses:
            ellipse(d, (e[0] + 12, e[1] + 16, e[2] + 12, e[3] + 16), (247, 235, 205, 255))
        for e in ellipses:
            ellipse(d, e, (255, 255, 249, 255))
        save(img, name, (512, 256))


def generate_bird_house_trees_pets():
    img, d = canvas((256, 128))
    line(d, [(30, 76), (72, 42), (128, 78), (184, 42), (226, 76)], (41, 43, 47, 255), 18)
    line(d, [(72, 42), (112, 68), (128, 78), (144, 68), (184, 42)], (26, 28, 31, 255), 8)
    save(img, "bird.png", (256, 128))

    img, d = canvas((512, 512))
    polygon(d, [(70, 240), (256, 80), (442, 240)], (236, 85, 76, 255))
    polygon(d, [(256, 80), (442, 240), (286, 220)], (188, 59, 61, 255))
    polygon(d, [(128, 228), (384, 228), (384, 430), (128, 430)], (255, 212, 73, 255))
    polygon(d, [(286, 228), (384, 228), (384, 430), (286, 430)], (234, 168, 54, 255))
    polygon(d, [(316, 112), (362, 132), (362, 196), (316, 174)], (146, 83, 58, 255))
    polygon(d, [(222, 318), (290, 318), (290, 430), (222, 430)], (143, 86, 57, 255))
    ellipse(d, (272, 372, 282, 382), (255, 211, 73, 255))
    for x in (158, 324):
        polygon(d, [(x, 266), (x + 58, 266), (x + 58, 322), (x, 322)], (119, 212, 232, 255))
        line(d, [(x + 29, 266), (x + 29, 322)], (236, 250, 248, 255), 4)
        line(d, [(x, 294), (x + 58, 294)], (236, 250, 248, 255), 4)
    save(img, "house.png", (512, 512))

    img, d = canvas((384, 512))
    polygon(d, [(172, 286), (220, 286), (234, 472), (154, 472)], (132, 82, 48, 255))
    polygon(d, [(195, 298), (236, 238), (258, 250), (210, 322)], (132, 82, 48, 255))
    for e, col in [
        ((70, 84, 210, 232), (72, 171, 82, 255)),
        ((160, 62, 304, 216), (82, 190, 92, 255)),
        ((116, 162, 292, 328), (56, 151, 76, 255)),
        ((42, 178, 182, 320), (94, 203, 96, 255)),
    ]:
        ellipse(d, e, col)
    save(img, "tree-1.png", (384, 512))

    img, d = canvas((384, 512))
    polygon(d, [(178, 232), (218, 232), (226, 474), (166, 474)], (126, 78, 47, 255))
    polygon(d, [(198, 256), (146, 194), (166, 178), (208, 232)], (126, 78, 47, 255))
    ellipse(d, (118, 58, 268, 218), (79, 176, 84, 255))
    ellipse(d, (78, 130, 226, 292), (95, 203, 96, 255))
    ellipse(d, (174, 138, 306, 286), (55, 151, 76, 255))
    save(img, "tree-2.png", (384, 512))

    img, d = canvas((384, 384))
    ellipse(d, (92, 136, 272, 284), (243, 137, 54, 255))
    ellipse(d, (58, 78, 174, 188), (255, 154, 65, 255))
    polygon(d, [(76, 88), (90, 28), (126, 82)], (255, 154, 65, 255))
    polygon(d, [(126, 84), (166, 34), (162, 108)], (255, 154, 65, 255))
    polygon(d, [(91, 74), (98, 47), (116, 76)], (255, 184, 187, 255))
    polygon(d, [(138, 76), (158, 52), (154, 92)], (255, 184, 187, 255))
    line(d, [(260, 168), (332, 126), (326, 74)], (242, 137, 54, 255), 34)
    eye(d, 102, 126, 14, 8)
    eye(d, 148, 126, 14, 8)
    cheek(d, 78, 150, 12)
    cheek(d, 168, 150, 12)
    line(d, [(110, 154), (126, 166), (142, 154)], (117, 51, 54, 255), 5)
    ellipse(d, (104, 284, 138, 320), (213, 100, 41, 255))
    ellipse(d, (210, 282, 244, 320), (213, 100, 41, 255))
    save(img, "cat.png", (384, 384))

    img, d = canvas((256, 384))
    ellipse(d, (66, 130, 190, 318), (255, 255, 250, 255))
    ellipse(d, (55, 70, 115, 192), (255, 255, 250, 255))
    ellipse(d, (140, 70, 200, 192), (255, 255, 250, 255))
    ellipse(d, (75, 90, 102, 172), (255, 188, 203, 255))
    ellipse(d, (153, 90, 180, 172), (255, 188, 203, 255))
    ellipse(d, (74, 154, 182, 258), (255, 255, 250, 255))
    ellipse(d, (94, 194, 104, 204), (38, 34, 38, 255))
    ellipse(d, (152, 194, 162, 204), (38, 34, 38, 255))
    ellipse(d, (122, 211, 136, 223), (255, 120, 166, 255))
    cheek(d, 86, 224, 10)
    cheek(d, 170, 224, 10)
    ellipse(d, (76, 302, 112, 334), (238, 238, 230, 255))
    ellipse(d, (144, 302, 180, 334), (238, 238, 230, 255))
    save(img, "rabbit.png", (256, 384))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    generate_fish()
    generate_anglerfish()
    generate_rod()
    generate_stars()
    generate_moon_sun()
    generate_clouds()
    generate_bird_house_trees_pets()


if __name__ == "__main__":
    main()
