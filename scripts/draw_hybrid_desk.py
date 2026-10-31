"""hybrid 的辦公桌背景：用 PIL 畫的像素風（三個模式的桌面各用那個時代的方法畫）。

輸出兩張小圖，瀏覽器用 image-rendering: pixelated 放大：
  assets/bg/hybrid_wall.png  192×76  牆、窗、白板、時鐘、盆栽（會被螢幕擋住一部分，故意的）
  assets/bg/hybrid_wood.png  192×15  桌面
用法：python scripts/draw_hybrid_desk.py
"""
import random
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "bg"
rng = random.Random(2024)

WALL, WALL_DOT = (205, 212, 220), (198, 206, 215)
FRAME, SKY, SKY_HI = (120, 118, 112), (160, 200, 230), (190, 220, 240)
CLOUD = (250, 252, 255)
BUILD = [(96, 118, 140), (112, 134, 156), (84, 104, 124), (128, 150, 170)]
LIT = (244, 233, 176)
TREE = [(74, 140, 86), (60, 122, 72)]
BOARD, BOARD_EDGE = (246, 247, 244), (170, 174, 180)
NOTES = [(255, 236, 120), (255, 196, 160), (190, 232, 190), (190, 214, 255), (255, 205, 225)]
INK = (70, 74, 86)
POT, LEAF = [(150, 90, 60), (176, 108, 72)], [(70, 150, 90), (90, 176, 108), (54, 122, 72)]


def draw_wall():
    im = Image.new("RGB", (192, 76), WALL)
    px = im.load()
    for y in range(76):                       # 兩色點陣，程式鋪的牆
        for x in range(192):
            if (x + y) % 2 == 0 and (x * 7 + y * 13) % 5 == 0:
                px[x, y] = WALL_DOT
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 191, 1], fill=(190, 198, 208))

    # 窗：矮而寬，放在筆電上方，下半會被筆電擋住
    d.rectangle([16, 4, 74, 26], fill=FRAME)
    d.rectangle([18, 6, 72, 24], fill=SKY)
    d.rectangle([18, 6, 72, 12], fill=SKY_HI)
    for cx, cy, w in [(24, 8, 9), (50, 10, 12)]:
        d.rectangle([cx, cy, cx + w, cy + 1], fill=CLOUD)
        d.rectangle([cx + 2, cy - 1, cx + w - 3, cy - 1], fill=CLOUD)
    x = 19
    while x < 71:                             # 隨機長出來的天際線
        w = rng.randint(4, 9); h = rng.randint(5, 13)
        d.rectangle([x, 24 - h, min(x + w, 71), 24], fill=rng.choice(BUILD))
        for _ in range(rng.randint(0, 2)):
            wx = rng.randint(x, min(x + w, 70)); wy = rng.randint(24 - h + 1, 22)
            px[wx, wy] = LIT
        x += w + 1
    d.rectangle([18, 21, 30, 24], fill=TREE[0]); d.rectangle([40, 22, 48, 24], fill=TREE[1])
    d.rectangle([45, 6, 46, 24], fill=FRAME)
    d.rectangle([15, 27, 75, 28], fill=(182, 176, 166))

    # 時鐘：左上，要看得到時間
    d.rectangle([3, 6, 14, 17], fill=(90, 70, 50)); d.rectangle([4, 7, 13, 16], fill=(246, 241, 231))
    d.rectangle([8, 8, 8, 12], fill=INK); d.rectangle([8, 12, 11, 12], fill=INK)

    # 白板：外接螢幕上方，貼一排便利貼（迴圈排的）
    d.rectangle([80, 3, 150, 12], fill=BOARD_EDGE); d.rectangle([81, 4, 149, 11], fill=BOARD)
    for i in range(9):
        x0 = 83 + i * 7
        d.rectangle([x0, 5, x0 + 4, 9], fill=NOTES[i % len(NOTES)])
        px[x0 + 1, 7] = INK
    d.rectangle([84, 10, 120, 10], fill=(150, 160, 200))

    # 盆栽：右邊露一點葉子
    d.rectangle([184, 22, 189, 27], fill=POT[0]); d.rectangle([183, 21, 190, 22], fill=POT[1])
    for lx, ly, w, h, c in [(182, 14, 4, 7, LEAF[0]), (186, 11, 4, 9, LEAF[1]), (189, 15, 3, 6, LEAF[2])]:
        d.rectangle([lx, ly, lx + w, ly + h], fill=c)

    return im


def draw_wood():
    im = Image.new("RGB", (192, 15), (168, 150, 128))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 191, 0], fill=(196, 180, 158)); d.rectangle([0, 1, 191, 1], fill=(120, 104, 84))
    for _ in range(14):                       # 隨機的木紋
        x0 = rng.randint(0, 150); w = rng.randint(20, 70); y = rng.randint(3, 14)
        d.rectangle([x0, y, min(x0 + w, 191), y], fill=rng.choice([(154, 136, 114), (178, 160, 138), (160, 142, 120)]))
    return im


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    draw_wall().save(OUT / "hybrid_wall.png")
    draw_wood().save(OUT / "hybrid_wood.png")
    print("wrote", OUT / "hybrid_wall.png", OUT / "hybrid_wood.png")
