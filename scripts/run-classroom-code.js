// scripts/run-classroom-code.js — 小教室每頁的程式碼都真的跑一次，輸出要跟 code.output 一樣。
// 資料結構的頁每種語言有內建、自己刻兩份；程式設計課的頁每種語言一份。
// 用法：node scripts/run-classroom-code.js [課程/頁 id ...]（資料結構的頁可以省略課程，例如 heap）；要裝 python、javac／java、gcc、g++。有一份對不上就非零結束
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const CR = require('../classroom.js');

// input 是程式讀的輸入（stdin），沒有就是空的
const run = (cmd, args, cwd, input = '') => execFileSync(cmd, args, { cwd, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const RUNNERS = {
  python: (dir, src, stdin) => { fs.writeFileSync(path.join(dir, 'main.py'), src); return run('python', ['-I', 'main.py'], dir, stdin); },
  js: (dir, src, stdin) => { fs.writeFileSync(path.join(dir, 'main.js'), src); return run('node', ['main.js'], dir, stdin); },
  // 原始檔是 UTF-8（範例有中文註解）；JDK 17 以前的 javac 預設用系統編碼讀，要明講
  java: (dir, src, stdin) => { fs.writeFileSync(path.join(dir, 'Main.java'), src); run('javac', ['-encoding', 'UTF-8', 'Main.java'], dir); return run('java', ['-cp', dir, 'Main'], dir, stdin); },
  c: (dir, src, stdin) => { fs.writeFileSync(path.join(dir, 'main.c'), src); run('gcc', ['-std=c11', '-o', 'main.exe', 'main.c'], dir); return run(path.join(dir, 'main.exe'), [], dir, stdin); },
  cpp: (dir, src, stdin) => { fs.writeFileSync(path.join(dir, 'main.cpp'), src); run('g++', ['-std=c++17', '-o', 'main.exe', 'main.cpp'], dir); return run(path.join(dir, 'main.exe'), [], dir, stdin); },
};

// 跑一份程式（stdin 是餵給它的輸入），回傳去掉頭尾空白的輸出；跑不起來就回傳錯誤的第一行
function runSource(key, lang, src, stdin) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `classroom-${key.replace('/', '-')}-${lang}-`));
  try { return RUNNERS[lang](dir, src, stdin).replace(/\r\n/g, '\n').trim(); }
  catch (e) { return `（跑不起來）${(e.stderr || e.message || '').toString().trim().split('\n')[0]}`; }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 那頁要跑的每一份：[語言, 哪一份, 原始碼]
const sources = (course, code) => CR.LANGS[course].flatMap(([lang]) => (typeof code[lang] === 'string'
  ? [[lang, '', code[lang]]]
  : [['builtin', code[lang].builtin], ['handmade', code[lang].handmade]].map(([kind, src]) => [lang, kind, src])));

// 觀念頁（附錄 Big-O）沒有實作，不用跑
const all = Object.entries(CR.PAGES).flatMap(([course, pages]) => Object.keys(pages).filter(id => pages[id].code).map(id => `${course}/${id}`));
const keys = process.argv.slice(2).length ? process.argv.slice(2).map(a => (a.includes('/') ? a : `ds/${a}`)) : all;
let bad = 0;
if (require.main === module) {
  const check = (key, what, src, lang, expected, stdin) => {
    const out = runSource(key, lang, src, stdin);
    const ok = out === expected; if (!ok) bad++;
    console.log(`${ok ? '✓' : '✗'} ${what}：${out.replace(/\n/g, ' ')}${ok ? '' : `（應該是 ${expected.replace(/\n/g, ' ')}）`}`);
  };
  for (const key of keys) {
    const [course, id] = key.split('/');
    const page = CR.PAGES[course][id];
    for (const [lang, kind, src] of sources(course, page.code)) check(key, `${id} ${lang}${kind ? ` ${kind}` : ''}`, src, lang, page.code.output, page.code.stdin);
    // 程式設計課的試試看：每題驗算用的完整程式（讀輸入的題目寫 stdin）
    (page.tryit || []).forEach((q, k) => {
      for (const [lang] of CR.LANGS[course]) check(key, `${id} 試試看 ${k + 1} ${lang}`, q.program[lang], lang, q.output, q.stdin);
    });
    // 課外補充帶的範例程式
    (page.extra || []).forEach((t, k) => {
      if (t.code) for (const [lang] of CR.LANGS[course]) check(key, `${id} 課外補充 ${k + 1} ${lang}`, t.code[lang], lang, t.code.output, t.code.stdin);
    });
  }
  process.exit(bad ? 1 : 0);
}
module.exports = { runSource };
