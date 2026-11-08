// scripts/build-handwriting.js：把劇本裡寫死的手寫文字畫成 assets/hand/<key>.png，並產生對照表 hand-data.js。
// 玩家自己寫的（便條、HTTP 對照表）用阿童體：阿童的手寫字型，justfont justwrite 計畫製作，授權只限本人電腦，所以只能畫成圖。
// 老闆講的話留在桌上的紙（來源的 lines）用辰宇落雁體（OFL 1.1，https://github.com/Chenyu-otf/chenyuluoyan_thin），
// 下載 ChenYuluoyan-2.0-Thin.ttf 放到 originals/fonts/。來源寫了 hand: 'boss_wife' 的（老闆娘留的便條）用佮逸體
// （逸嘉的手寫字，OFL，Kahikfontproportional.ttf 放到 originals/fonts/kahik/）。字型都不放進 repo，路徑不同時用環境變數指定：
//   HAND_FONT_PLAYER=<阿童體> HAND_FONT_BOSS=<辰宇落雁體> HAND_FONT_BOSS_WIFE=<佮逸體> node scripts/build-handwriting.js
// 來源只有 text 的是印出來的文件，不畫成手寫。劇本改了文字就重跑一次，用不到的圖會刪掉。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { C } = require('../contract.js');
const DAY1 = require('../day1.js');
const DAY2 = require('../day2.js');
const DAY3 = require('../day3.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');
require('../sandbox-scenery.js');
require('../sandbox-fate.js');
const { textKey } = require('../paper-ink.js');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'hand');
const TMP_DIR = path.join(ROOT, 'tmp');
const FONTS = {
  HAND_FONT_PLAYER: process.env.HAND_FONT_PLAYER || 'C:\\Windows\\Fonts\\ATon-Proportional.ttf',
  HAND_FONT_BOSS: process.env.HAND_FONT_BOSS || path.join(ROOT, 'originals', 'fonts', 'ChenYuluoyan-2.0-Thin.ttf'),
  HAND_FONT_BOSS_WIFE: process.env.HAND_FONT_BOSS_WIFE || path.join(ROOT, 'originals', 'fonts', 'kahik', 'Kahikfontproportional.ttf'),
};

function scripts() {
  // 正式上班：每一關照三個時代各做一份（便條可能跟時代走）
  const office = Sandbox.ids().flatMap(id => ['legacy', 'hybrid', 'speedrun'].map(mode => Sandbox.make(id, mode)));
  return [DAY1, DAY1.day2stub, DAY2.make({}), DAY2.day3stub, DAY3.make({}), ...office].filter(Boolean);
}

function collect() {
  const entries = new Map();
  const add = (role, text) => { if (text) entries.set(textKey(text), { key: textKey(text), role, text }); };
  add('player', C.HTTP_NOTE);
  for (const script of scripts()) {
    add('player', script.unlabeled && script.unlabeled.note);
    for (const src of script.sources || []) {
      if (src.kind !== 'boss') continue;
      for (const version of src.variants || [src]) if (version.lines) add(src.hand || 'boss', version.lines.join('\n'));
    }
  }
  return [...entries.values()];
}

function main() {
  const missing = Object.entries(FONTS).filter(([, file]) => !fs.existsSync(file)).map(([env, file]) => `${env}（找不到 ${file}）`);
  if (missing.length) { console.error(`缺字型：${missing.join('、')}`); process.exit(1); }

  const entries = collect();
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const listFile = path.join(TMP_DIR, 'hand-entries.json');
  fs.writeFileSync(listFile, JSON.stringify(entries));
  const out = execFileSync('python', ['-I', path.join(__dirname, 'render_handwriting.py'), listFile, OUT_DIR],
    { encoding: 'utf8', env: { ...process.env, ...FONTS, PYTHONUTF8: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
  const sizes = JSON.parse(out.trim().split('\n').pop());

  const keep = new Set(Object.keys(sizes).map(k => `${k}.png`));
  for (const file of fs.readdirSync(OUT_DIR)) if (file.endsWith('.png') && !keep.has(file)) fs.unlinkSync(path.join(OUT_DIR, file));

  const sorted = Object.fromEntries(Object.keys(sizes).sort().map(k => [k, sizes[k]]));
  fs.writeFileSync(path.join(ROOT, 'hand-data.js'),
    '// hand-data.js — 由 scripts/build-handwriting.js 產生，不要手改。手寫圖 assets/hand/<key>.png 的寬高（CSS px）。\n' +
    `(function (root) { root.HAND_DATA = ${JSON.stringify(sorted)}; })(typeof window !== 'undefined' ? window : globalThis);\n`);
  console.log(`畫了 ${Object.keys(sizes).length} 張手寫圖`);
  for (const e of entries) console.log(`  ${e.key}  ${e.role.padEnd(6)}  ${e.text.split('\n')[0]}`);
}

if (require.main === module) main();
module.exports = { collect };
