// scripts/run-classroom-code.js — 小教室每頁四種語言的程式碼（內建、自己刻）都真的跑一次，輸出要跟 code.output 一樣。
// 用法：node scripts/run-classroom-code.js [頁 id ...]；要裝 python、javac／java、g++。有一份對不上就非零結束
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const CR = require('../classroom.js');

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const RUNNERS = {
  python: (dir, src) => { fs.writeFileSync(path.join(dir, 'main.py'), src); return run('python', ['-I', 'main.py'], dir); },
  js: (dir, src) => { fs.writeFileSync(path.join(dir, 'main.js'), src); return run('node', ['main.js'], dir); },
  // 原始檔是 UTF-8（範例有中文註解）；JDK 17 以前的 javac 預設用系統編碼讀，要明講
  java: (dir, src) => { fs.writeFileSync(path.join(dir, 'Main.java'), src); run('javac', ['-encoding', 'UTF-8', 'Main.java'], dir); return run('java', ['-cp', dir, 'Main'], dir); },
  cpp: (dir, src) => { fs.writeFileSync(path.join(dir, 'main.cpp'), src); run('g++', ['-std=c++17', '-o', 'main.exe', 'main.cpp'], dir); return run(path.join(dir, 'main.exe'), [], dir); },
};

// 觀念頁（附錄 Big-O）沒有實作，不用跑
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CR.PAGES).filter(id => CR.PAGES[id].code);
let bad = 0;
for (const id of ids) {
  const code = CR.PAGES[id].code;
  for (const [lang] of CR.LANGS) for (const kind of ['builtin', 'handmade']) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `classroom-${id}-${lang}-`));
    let out;
    try { out = RUNNERS[lang](dir, code[lang][kind]).replace(/\r\n/g, '\n').trim(); }
    catch (e) { out = `（跑不起來）${(e.stderr || e.message || '').toString().trim().split('\n')[0]}`; }
    const ok = out === code.output; if (!ok) bad++;
    console.log(`${ok ? '✓' : '✗'} ${id} ${lang} ${kind}：${out}${ok ? '' : `（應該是 ${code.output}）`}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
process.exit(bad ? 1 : 0);
