// scripts/build-seo.js — 產生給搜尋引擎讀的靜態頁：每頁一個真網址、內文預先寫進 HTML（JS 載入後再換成互動版）
// 用法：node scripts/build-seo.js（寫檔）／node scripts/build-seo.js --check（只比對，跟 repo 裡的不一樣就列出來、exit 1）
// 產生：se.html（認識軟體工程）、handbook.html（新人手冊）、atlas.html（IT 圖鑑）、CSIE 課程各頁（classroom-static.js 提供）、sitemap.xml
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SITE = 'https://tsun-u.github.io/it24hr/';
const OG_IMAGE = `${SITE}assets/og-image.jpg`;
const AUTHORS = [{ '@type': 'Person', name: 'Tsun-u' }, { '@type': 'Person', name: 'ATone' }];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 從 path 算回網站根目錄的相對路徑：csie/ds/stack.html → ../../
const up = (file) => '../'.repeat(file.split('/').length - 1);

// 內文的 Markdown 行內語法：**粗體**、*斜體*、`程式`、[文字](網址)
function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// 內容區塊（se-content.js 的格式）轉成 HTML
function blocks(list = []) {
  return list.map((b) => {
    switch (b.t) {
      case 'p': return `<p>${inline(b.text)}</p>`;
      case 'h': return `<h4>${inline(b.text)}</h4>`;
      case 'quote': return `<blockquote><p>${inline(b.text)}</p></blockquote>`;
      case 'field': return `<p><strong>${inline(b.label)}</strong>：${inline(b.text)}</p>`;
      case 'code': return `<pre><code>${esc(b.text)}</code></pre>`;
      case 'list': return `<ul>${b.items.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`;
      case 'table': return `<table><thead><tr>${b.head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead>`
        + `<tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      default: throw new Error(`不認得的區塊：${b.t}`);
    }
  }).join('\n');
}

// 每頁共用的 <head>：標題、描述、canonical、Open Graph、JSON-LD；資源路徑照頁面深度寫相對路徑
function head({ file, title, description, type = 'website', jsonld }) {
  const url = SITE + (file === 'index.html' ? '' : file);
  const rel = up(file);
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="IT24hr">',
    '<meta property="og:locale" content="zh_TW">',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    ...(jsonld ? [`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...jsonld, url })}</script>`] : []),
    `<link rel="icon" href="${rel}assets/favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="${rel}assets/favicon-32.png" sizes="32x32" type="image/png">`,
    `<link rel="apple-touch-icon" href="${rel}assets/apple-touch-icon.png">`,
    `<link rel="stylesheet" href="${rel}styles.css">`,
  ].join('\n');
}

// 每頁底部互相連結（搜尋引擎靠站內連結找頁面）
const FOOT_LINKS = [['index.html', '玩 IT24hr'], ['se.html', '認識軟體工程'], ['csie.html', 'CSIE 課程'], ['handbook.html', '新人手冊'], ['atlas.html', 'IT 圖鑑']];

// 整頁：頂端列（回首頁、頁名、開始玩）、預先寫好的內文、頁面要載的 JS
function page({ file, heading, main, mainId, mainClass = 'csie-main', scripts = [], ...meta }) {
  const rel = up(file);
  return `<!doctype html>
<html lang="zh-Hant">
<head>
${head({ file, ...meta })}
</head>
<body class="csie-body">
<header class="csie-head">
  <a class="csie-logo" href="${rel}index.html">IT24hr</a>
  <h1>${esc(heading)}</h1>
  <a class="btn csie-play" href="${rel}index.html">開始玩</a>
</header>
<main${mainId ? ` id="${mainId}"` : ''} class="${mainClass}">
${main}
</main>
<footer class="seo-foot"><nav aria-label="IT24hr 的其他內容">${FOOT_LINKS.map(([href, text]) => `<a href="${rel}${href}">${text}</a>`).join('')}</nav></footer>
${scripts.map(s => `<script src="${rel}${s}"></script>`).join('\n')}
</body>
</html>
`;
}

// ── 認識軟體工程 ──
function sePage() {
  const C = require(path.join(root, 'se-content.js'));
  const section = (s, inner) => `<section>\n<h2>${inline(s.title)}</h2>\n${inner}\n</section>`;
  const main = [
    blocks(C.hero),
    section(C.walk, [blocks(C.walk.lead), blocks(C.walk.setting),
      ...C.walk.stations.map(st => `<h3>第 ${st.no} 站：${inline(st.title)}</h3>\n${blocks(st.blocks)}`), blocks([].concat(C.walk.closing))].join('\n')),
    section(C.sdlc, blocks(C.sdlc.blocks)),
    section(C.models, [blocks(C.models.lead), ...C.models.items.map(m => `<h3>${inline(m.title)}</h3>\n${blocks(m.blocks)}`)].join('\n')),
    section(C.ai, blocks(C.ai.blocks)),
    section(C.question, [blocks(C.question.lead), ...C.question.options.map(o => `<h3>${inline(o.label)}</h3>\n${blocks(o.blocks)}`)].join('\n')),
    blocks(C.summary),
    `<section>\n<h2>小範本</h2>\n${Object.entries(C.templates).map(([id, t]) => `<h3 id="${id}">${inline(t.title)}</h3>\n${blocks(t.blocks)}`).join('\n')}\n</section>`,
    `<section>\n<h2>參考資料</h2>\n${blocks(C.sources)}\n</section>`,
  ].join('\n');
  return {
    file: 'se.html', heading: '認識軟體工程', mainId: 'se', mainClass: 'csie-main se-page', main,
    scripts: ['vendor/rough.js', 'icons.js', 'se-content.js', 'se.js'],
    title: '認識軟體工程｜IT24hr', type: 'article',
    description: '只是加個折扣，為什麼要等兩週？跟著一家手搖飲從頭做一套點餐系統，走完需求、設計、開發、測試、上線，看懂軟體開發的流程和每個角色在做什麼。',
    jsonld: { '@type': 'Article', headline: '認識軟體工程', description: '跟著一家手搖飲從頭做一套點餐系統，看懂軟體開發的流程和每個角色在做什麼。',
      image: OG_IMAGE, inLanguage: 'zh-Hant-TW', dateModified: C.updated, author: AUTHORS, isPartOf: { '@type': 'WebSite', name: 'IT24hr', url: SITE } },
  };
}

// ── 新人手冊：每個詞一段，id 跟遊戲裡的詞條一樣（handbook.html#pm） ──
function handbookPage() {
  const G = require(path.join(root, 'glossary.js'));
  const term = (t) => `<section id="${t.id}">\n<h3>${esc(G.title(t))}</h3>\n<p>${inline(t.short)}</p>\n`
    + (t.more ? `<p>${t.more.split('\n').map(inline).join('<br>')}</p>\n` : '') + '</section>';
  const main = [
    '<p>IT 職場常聽到的詞，用一句話講清楚，再補上主要的工作或用途。在遊戲裡看到有虛線的詞，點一下也能查。</p>',
    ...G.GROUPS.map(g => `<h2>${esc(g)}</h2>\n${G.TERMS.filter(t => t.group === g).map(term).join('\n')}`),
  ].join('\n');
  return {
    file: 'handbook.html', heading: '新人手冊', mainClass: 'csie-main se-page', main,
    title: '新人手冊：IT 職場常用詞｜IT24hr',
    description: 'PM、SA、QC、需求單位、code review、部署、煙霧測試……IT 職場常聽到的詞，用一句話講清楚，再補上主要的工作或用途。',
    jsonld: { '@type': 'DefinedTermSet', name: '新人手冊', inLanguage: 'zh-Hant-TW',
      hasDefinedTerm: G.TERMS.map(t => ({ '@type': 'DefinedTerm', name: t.word, description: t.short, url: `${SITE}handbook.html#${t.id}` })) },
  };
}

// ── IT 圖鑑：四大類、每個職稱一行 ──
function atlasPage() {
  const A = require(path.join(root, 'atlas.js'));
  const main = [
    ...A.INTRO.map(p => `<p>${inline(p)}</p>`),
    ...A.TABS.map(tab => `<section id="${tab.id}">\n<h2>${esc(tab.name)}（${esc(tab.en)}）</h2>\n`
      + `<img src="${tab.art}" alt="${esc(tab.alt)}" loading="lazy">\n`
      + `<ul>${tab.jobs.map(j => `<li><strong>${esc(j.title)}</strong>：${inline(j.desc)}</li>`).join('')}</ul>\n</section>`),
    ...A.NOTES.map(p => `<p>${inline(p)}</p>`),
  ].join('\n');
  return {
    file: 'atlas.html', heading: 'IT 圖鑑', mainClass: 'csie-main se-page', main,
    title: 'IT 圖鑑：IT 領域的職稱與分工｜IT24hr',
    description: '前端、後端、韌體、資料工程、DevOps、資安、MIS……IT 領域常見的職稱各自在做什麼，分成軟體研發、硬體底層、資料與 AI、維運與安全四大類。',
    jsonld: { '@type': 'Article', headline: 'IT 圖鑑：IT 領域的職稱與分工', inLanguage: 'zh-Hant-TW', author: AUTHORS, image: OG_IMAGE },
  };
}

// ── CSIE 課程：classroom-static.js 提供 [{ path, title, description, html, heading?, scripts?, jsonld? }]，還沒有就先不產 ──
function classroomPages() {
  const file = path.join(root, 'classroom-static.js');
  if (!fs.existsSync(file)) return [];
  const Static = require(file);
  return Static.staticPages().map(p => ({
    file: p.path, heading: p.heading || 'CSIE 課程', main: p.html, mainId: 'csie', mainClass: p.mainClass || 'csie-main',
    scripts: p.scripts || [], title: p.title, description: p.description, type: p.type || 'article', jsonld: p.jsonld,
  }));
}

// 首頁和 csie.html 的 <head> 是手寫的，sitemap 照樣列
const HAND_WRITTEN = ['index.html', 'csie.html'];

function build() {
  const pages = [sePage(), handbookPage(), atlasPage(), ...classroomPages()];
  const out = new Map(pages.map(p => [p.file, page(p)]));
  const urls = [...HAND_WRITTEN, ...pages.map(p => p.file)].map(f => SITE + (f === 'index.html' ? '' : f));
  out.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  return out;
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [file, text] of build()) {
    const target = path.join(root, file);
    const now = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : null;
    if (now === text) continue;
    if (check) { stale.push(file); continue; }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
    console.log(`寫入 ${file}`);
  }
  if (check && stale.length) { console.error(`要重跑 node scripts/build-seo.js：${stale.join('、')}`); process.exit(1); }
}

module.exports = { build, head, page, blocks, inline, SITE };
