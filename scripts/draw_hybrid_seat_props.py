"""hybrid 的同事桌上小物：用 PIL 畫的像素小圖（三個時代的辦公室各用那個時代的方法畫，配色接 draw_hybrid_desk.py）。

每件 28×21、透明底，瀏覽器用 image-rendering: pixelated 放大三倍：
  assets/seat/hybrid/<id>.png
用法：python scripts/draw_hybrid_seat_props.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "seat" / "hybrid"
W, H = 28, 21

INK = (70, 74, 86)
PAPER, PAPER_SHADE = (250, 250, 246), (214, 216, 212)
LINE = (170, 174, 182)
NOTES = [(255, 236, 120), (255, 196, 160), (190, 232, 190), (190, 214, 255)]
POT, POT_DARK = (176, 108, 72), (150, 90, 60)
LEAF, LEAF_HI, LEAF_DARK = (90, 176, 108), (130, 200, 140), (54, 122, 72)
WOOD, WOOD_DARK = (176, 128, 80), (130, 90, 54)
WHITE = (252, 252, 252)
COFFEE, STAIN = (92, 58, 36), (170, 120, 80)
NAVY, GOLD = (48, 62, 104), (214, 178, 90)


def canvas(w=W, h=H):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def business_cards():
    im, d = canvas()
    for i, (x, y) in enumerate([(5, 11), (6, 9), (4, 8), (7, 6)]):   # 疊得歪七扭八
        d.rectangle([x, y, x + 14, y + 8], fill=PAPER, outline=LINE)
        d.line([x + 2, y + 2, x + 8, y + 2], fill=NAVY if i == 3 else LINE)
        d.line([x + 2, y + 5, x + 11, y + 5], fill=LINE)
    d.rectangle([16, 13, 26, 19], fill=PAPER, outline=LINE)          # 滑出來的那張
    d.line([18, 15, 22, 15], fill=LINE)
    return im


def golf_ball():
    im, d = canvas()
    d.ellipse([3, 14, 25, 20], fill=(74, 140, 86))                   # 推桿練習墊
    d.ellipse([18, 16, 22, 18], fill=(40, 70, 46))                   # 洞
    d.ellipse([7, 5, 16, 14], fill=WHITE, outline=PAPER_SHADE)
    for x, y in [(9, 8), (12, 7), (14, 10), (10, 11), (12, 12)]:
        d.point((x, y), fill=PAPER_SHADE)
    return im


def dirty_mug():
    im, d = canvas()
    d.rectangle([8, 5, 18, 19], fill=WHITE, outline=PAPER_SHADE)
    d.rectangle([9, 5, 17, 7], fill=COFFEE)                          # 杯底剩的咖啡（俯視看得到）
    d.arc([16, 8, 23, 15], -90, 90, fill=PAPER_SHADE, width=2)       # 把手
    for x, y in [(9, 9), (11, 10), (15, 9), (17, 11)]:               # 乾掉的咖啡漬
        d.line([x, y, x, y + 2], fill=STAIN)
    d.ellipse([3, 17, 9, 19], fill=(200, 160, 120))                  # 桌上的杯印
    return im


def calculator():
    im, d = canvas()
    d.rectangle([6, 1, 21, 20], fill=(150, 156, 166), outline=INK)
    d.rectangle([8, 3, 19, 6], fill=(170, 196, 160))                 # 螢幕，空白
    for row in range(4):
        for col in range(4):
            x, y = 8 + col * 3, 8 + row * 3
            d.rectangle([x, y, x + 1, y + 1], fill=(255, 196, 160) if col == 3 else (236, 238, 240))
    return im


def ledgers():
    im, d = canvas()
    for i in range(4):                                               # 排得整整齊齊
        x = 5 + i * 5
        d.rectangle([x, 3, x + 4, 19], fill=(48, 92, 70), outline=(34, 66, 50))
        d.line([x + 1, 6, x + 3, 6], fill=GOLD)
        d.line([x + 1, 16, x + 3, 16], fill=GOLD)
    d.line([4, 20, 25, 20], fill=WOOD_DARK)
    return im


def succulent():
    im, d = canvas()
    d.polygon([(8, 12), (20, 12), (18, 20), (10, 20)], fill=POT)
    d.rectangle([7, 11, 21, 13], fill=POT_DARK)
    for x0, y0, x1, y1, c in [(9, 6, 13, 11, LEAF_DARK), (15, 6, 19, 11, LEAF_DARK), (11, 3, 17, 9, LEAF),
                              (6, 8, 11, 12, LEAF), (17, 8, 22, 12, LEAF), (12, 6, 16, 11, LEAF_HI)]:
        d.ellipse([x0, y0, x1, y1], fill=c)
    return im


def todo_papers():
    im, d = canvas()
    d.rectangle([3, 7, 21, 19], fill=(232, 200, 120), outline=(190, 160, 90))   # 資料夾
    for i in range(3):
        x, y = 5 + i, 3 + i * 2
        d.rectangle([x, y, x + 16, y + 12], fill=PAPER, outline=LINE)
        for k in range(3):
            d.line([x + 2, y + 3 + k * 3, x + 12, y + 3 + k * 3], fill=LINE)
    d.rectangle([18, 2, 23, 7], fill=NOTES[0])                       # 便利貼
    d.rectangle([20, 9, 25, 14], fill=NOTES[1])
    d.line([9, 6, 9, 10], fill=(150, 156, 166))                      # 迴紋針
    d.line([10, 6, 10, 9], fill=(150, 156, 166))
    return im


def label_stickers():
    im, d = canvas()
    for i, c in enumerate([NOTES[0], NOTES[3], NOTES[2]]):           # 三捲標籤
        x = 3 + i * 8
        d.ellipse([x, 4, x + 7, 11], fill=c, outline=INK)
        d.ellipse([x + 2, 6, x + 5, 9], fill=PAPER_SHADE)
    d.rectangle([5, 13, 23, 19], fill=PAPER, outline=LINE)           # 一張還沒撕的
    for k in range(4):
        d.rectangle([7 + k * 4, 15, 9 + k * 4, 17], fill=NOTES[k % 4])
    return im


def kids_drawing():
    im, d = canvas()
    d.rectangle([3, 2, 24, 19], fill=PAPER, outline=LINE)
    d.line([3, 2, 6, 2], fill=(220, 220, 200)); d.line([21, 2, 24, 2], fill=(220, 220, 200))   # 膠帶
    d.ellipse([5, 4, 9, 8], fill=(255, 200, 60))                     # 太陽
    d.polygon([(16, 9), (19, 5), (22, 9)], fill=(220, 90, 70))       # 房子
    d.rectangle([17, 9, 21, 14], fill=(240, 180, 90))
    for x in (5, 9, 13):                                             # 三個手牽手的火柴人：頭（一格）、身體、兩隻手、兩隻腳
        d.point((x, 10), fill=INK)
        d.line([x, 12, x, 14], fill=INK)
        d.point((x - 1, 13), fill=INK); d.point((x + 1, 13), fill=INK)
        d.point((x - 1, 15), fill=INK); d.point((x + 1, 15), fill=INK)
    d.line([3, 18, 24, 18], fill=(110, 190, 110))                    # 草地
    return im


def orchid():
    im, d = canvas()
    d.rectangle([10, 15, 18, 20], fill=(236, 232, 222), outline=(196, 190, 176))   # 白瓷盆
    d.ellipse([6, 13, 13, 16], fill=LEAF_DARK); d.ellipse([15, 13, 22, 16], fill=LEAF)
    d.line([14, 14, 14, 4], fill=LEAF_DARK); d.line([14, 4, 20, 3], fill=LEAF_DARK)
    for x, y in [(13, 4), (17, 2), (21, 3), (11, 7)]:                # 白色蝴蝶蘭
        d.ellipse([x - 2, y - 1, x + 2, y + 3], fill=WHITE, outline=PAPER_SHADE)
        d.point((x, y + 1), fill=(240, 210, 90))
    return im


def family_photo():
    im, d = canvas()
    d.rectangle([5, 2, 22, 18], fill=WOOD, outline=WOOD_DARK)
    d.rectangle([7, 4, 20, 16], fill=(160, 200, 230))                # 照片：天空
    d.rectangle([7, 12, 20, 16], fill=(120, 180, 110))               # 草地
    for head, body in [((8, 6, 9, 7), (7, 9, 10, 16)),               # 一家人的剪影：爸、媽、小孩；頭跟身體中間空一行，人跟人中間空一格
                       ((12, 7, 13, 8), (12, 10, 14, 16)),
                       ((16, 10, 17, 11), (16, 13, 18, 16))]:
        d.rectangle(head, fill=INK); d.rectangle(body, fill=INK)
    d.line([13, 18, 11, 20], fill=WOOD_DARK)                         # 立架
    return im


def reading_glasses():
    im, d = canvas()
    d.rectangle([1, 12, 13, 20], fill=NAVY, outline=(30, 40, 70))    # 打開的眼鏡盒
    d.rectangle([2, 13, 12, 15], fill=(80, 96, 140))
    d.ellipse([15, 14, 20, 20], outline=(150, 156, 166))             # 摺好放在盒子旁邊的桌上：細金屬框
    d.ellipse([21, 14, 26, 20], outline=(150, 156, 166))
    d.line([20, 16, 21, 16], fill=(150, 156, 166))
    d.line([16, 13, 25, 13], fill=(150, 156, 166))                   # 摺在鏡片後面的鏡腳
    return im


def rose_phone():
    """老闆娘的手機：直立在手機架上、背面朝外，玫瑰金殼，跟玩家的公務手機分得出來。14×24。"""
    im, d = canvas(14, 24)
    rose, rose_edge = (248, 206, 198), (214, 160, 136)
    d.rounded_rectangle([2, 0, 11, 19], radius=2, fill=rose, outline=rose_edge)
    d.rounded_rectangle([4, 2, 8, 7], radius=1, fill=(232, 182, 168), outline=rose_edge)   # 相機凸起
    d.ellipse([5, 3, 7, 5], fill=INK); d.point((6, 6), fill=(255, 244, 214))               # 鏡頭、閃光燈
    d.rectangle([1, 21, 12, 23], fill=PAPER_SHADE); d.line([1, 21, 12, 21], fill=PAPER)      # 手機架底座
    d.rectangle([2, 18, 11, 20], fill=PAPER); d.line([2, 20, 11, 20], fill=PAPER_SHADE)      # 托住手機的前緣
    return im


def printer_cabinet():
    """淑芬座位旁的印表機櫃：靠牆的矮櫃＋雷射印表機。櫃子下半截被桌子擋住，畫到畫布底就停。36×40。"""
    im, d = canvas(36, 40)
    body, shade, cab, cab_dark = (244, 244, 240), (206, 208, 206), (176, 180, 188), (138, 142, 152)
    d.rectangle([4, 1, 31, 15], fill=body, outline=LINE)                    # 印表機
    d.line([5, 4, 30, 4], fill=shade)                                       # 掃描蓋
    d.rectangle([23, 2, 27, 3], fill=(70, 96, 140)); d.point((29, 2), fill=(90, 200, 120))   # 操作面板、燈
    d.rectangle([9, 7, 26, 8], fill=INK); d.line([11, 7, 24, 7], fill=WHITE)   # 出紙口和印好的紙
    d.line([5, 11, 30, 11], fill=shade); d.line([15, 13, 20, 13], fill=LINE)  # 紙匣
    d.rectangle([0, 16, 35, 17], fill=(196, 200, 206)); d.line([0, 17, 35, 17], fill=cab_dark)   # 櫃子檯面
    d.rectangle([0, 18, 35, 39], fill=cab, outline=cab_dark)
    d.line([17, 19, 17, 39], fill=cab_dark)                                 # 兩扇門
    d.rectangle([14, 23, 15, 26], fill=INK); d.rectangle([19, 23, 20, 26], fill=INK)   # 門把
    return im


PROPS = [business_cards, golf_ball, dirty_mug, calculator, ledgers, succulent,
         todo_papers, label_stickers, kids_drawing, orchid, family_photo, reading_glasses,
         rose_phone, printer_cabinet]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for fn in PROPS:
        im = fn()
        # 擺在桌上：整件往下移到畫布最底那列（落地），遊戲裡底部貼著桌面
        drop = im.height - im.getbbox()[3]
        landed = Image.new("RGBA", im.size, (0, 0, 0, 0)); landed.paste(im, (0, drop))
        landed.save(OUT / f"{fn.__name__}.png")
        print(f"seat/hybrid/{fn.__name__}.png")
