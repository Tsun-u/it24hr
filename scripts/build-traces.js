// scripts/build-traces.js — 程式設計課的程式追蹤器：每一步的變數和輸出由程式產生，不手寫。
// 對每個有 trace 的頁、每一組輸入（values 換掉程式裡的 {{n}}，stdin 是程式讀的輸入）：實際跑 Python 版（scripts/trace_python.py）記下每一步，寫進頁面
// 「// TRACE-RUNS-BEGIN」和「// TRACE-RUNS-END」中間；C、C++、Java 版也實際跑，輸出要跟 Python 一樣；
// 每一步執行到的 Python 行，在其他語言都要對得到一行。
// 用法：node scripts/build-traces.js [課程/頁 id ...]；加 --check 只比對、不寫檔（頁面上的資料過期就非零結束）
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const CR = require('../classroom.js');
const { runSource } = require('./run-classroom-code.js');

const BEGIN = '// TRACE-RUNS-BEGIN', END = '// TRACE-RUNS-END';
const { fill } = CR;
const pythonSteps = (code, stdin) => JSON.parse(execFileSync('python', ['-X', 'utf8', '-I', path.join(__dirname, 'trace_python.py')],
  { input: JSON.stringify({ code, stdin }), encoding: 'utf8' }));

// 寫進頁面的那一段：每組輸入一個陣列，每一步一行。換行照頁面檔原本的（Windows 上 git 取出來可能是 CRLF）
function runsBlock(runs, eol) {
  const lines = [`    ${BEGIN}（scripts/build-traces.js 產生，不要手改）`, '    runs: {'];
  for (const [label, steps] of Object.entries(runs)) {
    lines.push(`      ${JSON.stringify(label)}: [`, ...steps.map(s => `        ${JSON.stringify(s)},`), '      ],');
  }
  lines.push('    },', `    ${END}`);
  return lines.join(eol);
}

const check = process.argv.includes('--check');
const args = process.argv.slice(2).filter(a => a !== '--check');
const keys = args.length ? args : Object.entries(CR.PAGES).flatMap(([c, pages]) => Object.keys(pages).filter(id => pages[id].trace).map(id => `${c}/${id}`));
let bad = 0;
for (const key of keys) {
  const [course, id] = key.split('/');
  const t = CR.PAGES[course][id].trace;
  const runs = {};
  for (const { label, values, stdin } of t.inputs) {
    const steps = pythonSteps(fill(t.code.python, values), stdin);
    runs[label] = steps;
    const expected = steps.length ? steps[steps.length - 1].out.trim() : '';
    for (const [lang] of CR.LANGS[course]) {
      if (lang !== 'python') {
        for (const s of steps) if (!t.lines[lang][s.line]) { bad++; console.log(`✗ ${key} ${lang}：Python 第 ${s.line} 行對不到 ${lang} 的哪一行`); }
      }
      const out = runSource(key, lang, fill(t.code[lang], values), stdin);
      const ok = out === expected; if (!ok) bad++;
      console.log(`${ok ? '✓' : '✗'} ${key} ${label} ${lang}：${out}${ok ? '' : `（Python 印的是 ${expected}）`}`);
    }
  }
  const file = path.join(__dirname, '..', 'classroom', course, `${id}.js`);
  const src = fs.readFileSync(file, 'utf8');
  const re = new RegExp(`[ \\t]*${BEGIN}[\\s\\S]*?${END}`);
  if (!re.test(src)) { bad++; console.log(`✗ ${key}：頁面上找不到 ${BEGIN}／${END}`); continue; }
  const next = src.replace(re, runsBlock(runs, src.includes('\r\n') ? '\r\n' : '\n'));
  if (next === src) console.log(`✓ ${key}：頁面上的追蹤資料是最新的`);
  else if (check) { bad++; console.log(`✗ ${key}：頁面上的追蹤資料過期了，跑一次 node scripts/build-traces.js ${key}`); }
  else { fs.writeFileSync(file, next); console.log(`✓ ${key}：追蹤資料寫進頁面了`); }
}
process.exit(bad ? 1 : 0);
