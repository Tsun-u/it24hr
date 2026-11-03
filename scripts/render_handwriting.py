"""Render handwritten paper text to transparent PNG masks.

Usage: python -I scripts/render_handwriting.py <entries.json> <out_dir>
entries.json: [{"key": "...", "role": "player" | "boss" | "boss_wife", "text": "..."}]
Fonts come from the environment: HAND_FONT_PLAYER is 阿童體 (the player's handwriting),
HAND_FONT_BOSS is 辰宇落雁體 (the boss's), HAND_FONT_BOSS_WIFE is 佮逸體 (the boss's wife's);
a role whose font is missing is skipped.
Normally run through scripts/build-handwriting.js, which fills in the default paths.
Prints {"key": [css_width, css_height], ...} for the entries that were drawn.
"""
import json
import os
import re
import sys
import tempfile

from fontTools import subset
from PIL import Image, ImageDraw, ImageFont

SCALE = 2                    # PNG pixels per CSS pixel
FONT_PX = 28                 # CSS font size; handwriting strokes are dense, so it runs larger than printed text
LINE_PX = 42                 # CSS line height
WIDTH_PX = 372               # CSS content width of .paper-view .sheet (420 - 2 * 24 padding)
PAD_PX = 4
GLUE = set("，。、？！：；）」』》…,.?!:;)")   # never start a line with these
WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9._/-]*|.", re.S)   # one Latin word / number / file name, or one other character

FONT_ENV = {"player": "HAND_FONT_PLAYER", "boss": "HAND_FONT_BOSS", "boss_wife": "HAND_FONT_BOSS_WIFE"}


def unhinted_subset(font_path, chars, out_dir):
    """Subset to the needed characters without hinting; some handwriting fonts carry hinting PIL cannot run."""
    out = os.path.join(out_dir, os.path.basename(font_path) + ".subset.ttf")
    options = subset.Options()
    options.hinting = False
    options.layout_features = ["*"]
    sub = subset.Subsetter(options)
    font = subset.load_font(font_path, options)
    sub.populate(unicodes=[ord(c) for c in chars])
    sub.subset(font)
    subset.save_font(font, out, options)
    return out


def tokens(para, font, width):
    """Latin words, numbers and file names (CLAIRE.md) stay whole; a word wider than the line falls back to single characters."""
    for tok in WORD.findall(para):
        if len(tok) > 1 and font.getlength(tok) > width:
            yield from tok
        else:
            yield tok


def wrap(text, font, width):
    lines = []
    for para in text.split("\n"):
        line = ""
        for tok in tokens(para, font, width):
            if line and tok[0] not in GLUE and font.getlength(line + tok) > width:
                lines.append(line.rstrip())
                line = tok.lstrip()
            else:
                line += tok
        lines.append(line)
    return lines


def render(text, font):
    lines = wrap(text, font, (WIDTH_PX - 2 * PAD_PX) * SCALE)
    width = max(int(font.getlength(line)) for line in lines) + 2 * PAD_PX * SCALE
    height = LINE_PX * SCALE * len(lines)
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    offset = (LINE_PX - FONT_PX) * SCALE // 2
    for i, line in enumerate(lines):
        draw.text((PAD_PX * SCALE, i * LINE_PX * SCALE + offset), line, font=font, fill=255)
    image = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    image.putalpha(mask)
    return image


def main(entries_path, out_dir):
    with open(entries_path, encoding="utf-8") as f:
        entries = json.load(f)
    os.makedirs(out_dir, exist_ok=True)
    sizes = {}
    with tempfile.TemporaryDirectory() as tmp:
        for role, env in FONT_ENV.items():
            todo = [e for e in entries if e["role"] == role]
            if not todo:
                continue
            font_path = os.environ.get(env)
            if not font_path or not os.path.isfile(font_path):
                print(f"skip {role}: set {env} to the font file", file=sys.stderr)
                continue
            chars = {c for e in todo for c in e["text"] if c != "\n"}
            font = ImageFont.truetype(unhinted_subset(font_path, chars, tmp), FONT_PX * SCALE)
            for e in todo:
                image = render(e["text"], font)
                image.save(os.path.join(out_dir, e["key"] + ".png"), optimize=True)
                sizes[e["key"]] = [image.width // SCALE, image.height // SCALE]
    print(json.dumps(sizes))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
