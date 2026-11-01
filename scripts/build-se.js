// scripts/build-se.js — 把「認識軟體工程」的內容稿轉成頁面用的資料（se-content.js）
// 用法：node scripts/build-se.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SOURCE = path.join(root, '劇本', '認識軟體工程.md');
const TARGET = path.join(root, 'se-content.js');
const UPDATED = '2026-11-01';

const ONLY_FOR_DRAFT = /^（(小圖|做成頁面時)/;
const SURVEY_SOURCE = '- 台灣 18 門課的抽樣：各校公開的課程大綱（以上網址與大綱都在 2026-11-01 查閱）';

function parseTable(lines) {
  const cells = (line) => line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  return { t: 'table', head: cells(lines[0]), rows: lines.slice(2).map(cells) };
}

// 把一段 Markdown 切成區塊：標題、段落、表格、程式碼、引言、條列、「- **標題**：內容」欄位
function parseBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('<a id=') || ONLY_FOR_DRAFT.test(line)) continue;
    if (line.startsWith('### ')) { blocks.push({ t: 'h', text: line.slice(4) }); continue; }
    if (line.startsWith('```')) {
      const body = [];
      for (i++; !lines[i].startsWith('```'); i++) body.push(lines[i]);
      blocks.push({ t: 'code', text: body.join('\n') });
      continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i]);
      i--; blocks.push(parseTable(rows));
      continue;
    }
    if (line.startsWith('> ')) { blocks.push({ t: 'quote', text: line.slice(2) }); continue; }
    const field = /^- \*\*(.+?)\*\*：(.*)$/.exec(line);
    if (field) {
      const block = { t: 'field', label: field[1], text: field[2] };
      for (; /^\s*$|^ {2}/.test(lines[i + 1] ?? 'end') && i + 1 < lines.length; i++) {
        const next = lines[i + 1];
        if (!next.trim()) { if (/^ {2}/.test(lines[i + 2] ?? '')) continue; break; }
        const wrong = /^ {2}- 誤解：(.*)$/.exec(next); const right = /^ {2}- 正解：(.*)$/.exec(next);
        if (wrong) block.wrong = wrong[1];
        else if (right) block.right = right[1];
        else (block.quote ||= []).push(next.replace(/^ {2}> /, ''));
      }
      blocks.push(block);
      continue;
    }
    if (line.startsWith('- ')) {
      const items = [];
      for (; i < lines.length && lines[i].startsWith('- '); i++) items.push(lines[i].slice(2));
      i--; blocks.push({ t: 'list', items });
      continue;
    }
    blocks.push({ t: 'p', text: line });
  }
  return blocks;
}

// 依標題切段：回傳 [{ title, body }]
function splitBy(text, marker) {
  const parts = text.split(new RegExp(`^${marker} `, 'm')).slice(1);
  return parts.map((part) => {
    const [title, ...rest] = part.split(/\r?\n/);
    return { title: title.trim(), body: rest.join('\n') };
  });
}

function build(md) {
  const sections = splitBy(md, '##');
  const find = (key) => sections.find(s => s.title.includes(key));
  const walk = splitBy(find('一起走一次').body, '###');
  const lead = find('一起走一次').body.split(/^### /m)[0];
  const route = walk.find(s => s.title === '流程圖').body.split(/\r?\n/).find(l => l.includes(' → 需求訪談'));
  const short = route.split(' → ');
  const stationParts = walk.filter(s => s.title.startsWith('第 '));
  const stations = stationParts.map((s, i) => {
    const blocks = parseBlocks(s.body);
    return { no: i + 1, short: short[i], title: s.title.replace(/^第 \d+ 站：/, ''), blocks };
  });
  const last = stations[stations.length - 1];
  const closing = last.blocks.pop();

  const modelText = find('常見的開發模型').body;
  const questionParts = splitBy(find('最後聊一題').body, '###');
  const templates = {};
  const anchors = [...find('各站小範本').body.matchAll(/<a id="(t\d+-\d+)"><\/a>\s+### (.+)\r?\n([\s\S]*?)(?=<a id=|$)/g)];
  for (const [, id, title, body] of anchors) templates[id] = { title, blocks: parseBlocks(body) };

  return {
    updated: UPDATED,
    hero: parseBlocks(find('開場').body),
    sdlc: { title: find('SDLC').title, blocks: parseBlocks(find('SDLC').body) },
    walk: {
      title: find('一起走一次').title, lead: parseBlocks(lead),
      setting: parseBlocks(walk.find(s => s.title === '例子的設定').body), stations, closing,
    },
    models: {
      title: find('常見的開發模型').title, lead: parseBlocks(modelText.split(/^### /m)[0]),
      items: splitBy(modelText, '###').map(s => ({ title: s.title, blocks: parseBlocks(s.body) })),
    },
    ai: { title: find('AI 開發').title, blocks: parseBlocks(find('AI 開發').body) },
    question: {
      title: find('最後聊一題').title, lead: parseBlocks(find('最後聊一題').body.split(/^### /m)[0]),
      options: questionParts.map(s => ({ label: s.title.replace(/^選「|」$/g, ''), blocks: parseBlocks(s.body) })),
    },
    summary: parseBlocks(find('結尾').body),
    templates,
    sources: parseBlocks(find('查證來源').body.replace(/^- 台灣 18 門課的抽樣.*$/m, SURVEY_SOURCE)),
  };
}

const md = fs.readFileSync(SOURCE, 'utf8').split(/^---\s*$/m).slice(1).join('---');
const data = JSON.stringify(build(md), null, 1);
fs.writeFileSync(TARGET, `// se-content.js — 認識軟體工程頁（se.html）的內容，由 scripts/build-se.js 產生
(function (root) {
  const SE_CONTENT = ${data};
  if (typeof module !== 'undefined' && module.exports) module.exports = SE_CONTENT;
  else root.SE_CONTENT = SE_CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);
`);
console.log(`se-content.js：${Buffer.byteLength(data)} bytes`);
