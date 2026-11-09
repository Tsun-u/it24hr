// classroom-static.js — CSIE 課程每一頁的靜態 HTML（給搜尋引擎讀，scripts/build-seo.js 包外框寫檔）。
// csie/index.html 課程目錄、csie/<課>/index.html 一門課的目錄、csie/<課>/<頁>.html 一頁講義；
// 講義頁的文字先寫進 HTML，JS 載入後 classroom-view.js 換成有圖、沙盒、追蹤器的互動版
const fs = require('fs');
const path = require('path');
const Classroom = require('./classroom.js');
const { COURSES } = require('./csie.js');
const { NAMES } = require('./verdict.js');

const SITE = 'https://tsun-u.github.io/it24hr/';
const AUTHORS = [{ '@type': 'Person', name: 'Tsun-u' }, { '@type': 'Person', name: 'ATone' }];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tag = (name, cls, inner) => `<${name}${cls ? ` class="${cls}"` : ''}>${inner}</${name}>`;
const text = (name, cls, s) => tag(name, cls, esc(s));

const readyCourses = () => COURSES.filter(c => c.ready);
const written = (course) => Classroom.items(course).filter(it => Classroom.PAGES[course]?.[it.id]);

// 講義頁要載的 JS：共用的幾支、這門課 classroom/<課>/ 底下每一頁、畫面
function lessonScripts(course) {
  const files = fs.readdirSync(path.join(__dirname, 'classroom', course)).filter(f => f.endsWith('.js')).sort();
  return ['vendor/rough.js', 'icons.js', 'verdict.js', 'classroom.js', ...files.map(f => `classroom/${course}/${f}`), 'classroom-view.js', 'csie.js'];
}

// ── 講義頁的內文，段落和 classroom-view.js 的 pageNode 一樣；圖、沙盒、追蹤器只有互動版 ──
function lessonBody(course, id, page) {
  const langs = Classroom.LANGS[course];
  const sec = (title, ...inner) => tag('section', 'cr-sec', [text('h4', '', title), ...inner].join(''));
  // 一段文字；{ text, see } 的 see 是翻到別頁的連結（同 classroom-view 的 prose）
  const prose = (name, t) => {
    if (typeof t === 'string') return text(name, '', t);
    const links = [].concat(t.see).map((to) => {
      const [c, pid] = to.includes('/') ? to.split('/') : [course, to];
      return `<a class="cr-link cr-see" href="${Classroom.href(course, c, pid)}">→ ${esc(Classroom.item(c, pid).zh)}</a>`;
    });
    return tag(name, '', `${esc(t.text)} ${links.join('')}`);
  };
  const ul = (arr) => tag('ul', '', arr.map(t => prose('li', t)).join(''));
  const hook = (s) => text('p', 'cr-hook', s);
  const pre = (s) => text('pre', 'cr-pre', s.replace(/\n$/, ''));
  const table = (rows) => tag('table', 'cr-big-o', rows.map(([a, b]) => tag('tr', '', text('td', '', a) + text('td', 'mono', b))).join(''));
  const traps = tag('div', 'cr-traps', page.traps.map(({ wrong, right }) => tag('div', 'cr-trap',
    tag('p', 'cr-trap-line wrong', `${text('span', 'cr-sr', '誤解：')}${text('span', '', wrong)}`)
    + tag('p', 'cr-trap-line right', `${text('span', 'cr-sr', '正解：')}${text('span', '', right)}`))).join(''));
  const stdin = (s) => (s === undefined ? '' : text('p', 'cr-tr-label', '輸入') + text('pre', 'cr-tr-stdin', s.replace(/\n$/, '')));
  const output = (s) => text('p', 'cr-out mono', `輸出：${s}`);
  const langName = (v) => langs.find(([k]) => k === v)[1];

  if (page.layout === 'reference') {
    return [
      sec('生活比喻', hook(page.analogy)),
      sec('什麼時候會用到', ul(page.uses)),
      sec('核心觀念', ...page.concept.map(t => prose('p', t))),
      sec('怎麼算', ...page.howto.map(({ title, code, note }) => tag('div', 'cr-howto', text('p', 'cr-sub', title) + pre(code) + text('p', '', note)))),
      sec('常見誤解', traps),
      sec('總表', tag('table', 'cr-big-o cr-overview', Classroom.complexityTable(course).map(g =>
        tag('tr', '', `<th colspan="2"><a class="cr-link" href="${Classroom.href(course, course, g.id)}">${esc(`${g.name}　${g.zh}`)}</a></th>`)
        + g.rows.map(([op, o]) => tag('tr', '', text('td', '', op) + text('td', 'mono', o))).join('')).join(''))),
      sec('總結', hook(page.summary)),
    ];
  }
  if (page.layout === 'program') {
    const code = langs.map(([v, label]) => text('p', 'cr-sub', label) + pre(page.code[v])).join('');
    // 試試看只放題目和選項：答案和解析留給互動版，搜尋結果的摘要才不會直接印出答案
    const tryit = page.tryit.map((q, k) => tag('div', 'cr-try',
      tag('p', 'cr-try-q', text('span', 'cr-try-kind', q.kind) + text('span', '', `${k + 1}. ${q.prompt}`))
      + text('p', 'cr-sub', langName(langs[0][0])) + pre(q.code[langs[0][0]]) + stdin(q.stdin)
      + tag('ol', 'cr-try-opts', q.options.map(o => text('li', '', o)).join(''))));
    return [
      sec('生活應用', hook(page.analogy)),
      ...(page.review ? [sec('複習', ...page.review.map(t => (t.quote ? text('blockquote', 'cr-quote', t.quote) : prose('p', t))))] : []),
      sec('核心觀念', ...page.concept.map(t => prose('p', t))),
      sec('什麼時候會用到', ul(page.uses)),
      sec('常見誤解', traps),
      sec('實作', tag('div', 'cr-code', code + stdin(page.code.stdin) + output(page.code.output))),
      ...(page.cost ? [sec('跑幾步', table(page.cost.rows), prose('p', page.cost.note))] : []),
      sec('試試看', ...tryit),
      sec('總結', hook(page.summary)),
      ...(page.extra ? [sec('課外補充', ...page.extra.map(t => prose('p', t)))] : []),
    ];
  }
  const stamp = page.stamp && NAMES[page.stamp];
  const code = langs.map(([v, label]) => text('p', 'cr-sub', `${label}：用內建的`) + pre(page.code[v].builtin)
    + text('p', 'cr-sub', `${label}：自己刻（考試要手寫）`) + pre(page.code[v].handmade)).join('');
  return [
    sec('生活比喻', hook(page.analogy)),
    sec('什麼時候會用到', ul(page.uses)),
    sec('核心觀念', ...page.concept.map(t => prose('p', t))),
    ...(page.game ? [sec('你在遊戲裡為什麼是它', ...(stamp ? [text('p', 'stamp', stamp.name), text('p', 'cr-stamp-line', `「${stamp.line}」`)] : []), text('p', '', page.game))] : []),
    sec('常見誤解', traps),
    sec('實作', tag('div', 'cr-code', code + output(page.code.output))),
    sec('時間複雜度', table(page.complexity), text('p', 'cr-hint', 'O(1)、O(n) 是什麼意思、怎麼算，見附錄「時間複雜度」。')),
    sec('總結', hook(page.summary)),
  ];
}

// 講義頁左欄的目錄：寫好的是連結，準備中的不是
function nav(course, current) {
  const PAGES = Classroom.PAGES[course] || {};
  return tag('nav', 'cr-nav', Classroom.TOC[course].map(g => text('p', 'cr-group', g.group) + g.items.map((it) => {
    const inner = text('span', 'mono', it.name) + text('small', '', PAGES[it.id] ? it.zh : `${it.zh}・準備中`);
    if (!PAGES[it.id]) return tag('span', 'cr-item soon', inner);
    return `<a class="cr-item${it.id === current ? ' on' : ''}" href="${Classroom.href(course, course, it.id)}">${inner}</a>`;
  }).join('')).join(''));
}

// description 至少 20 字：「中文名（英文名）：」加上那頁的比喻；比喻太長就只取第一句
function lessonDescription(item, page) {
  const first = page.analogy.length > 90 ? page.analogy.slice(0, page.analogy.search(/[。？！]/) + 1) || page.analogy : page.analogy;
  return `${item.zh}（${item.name}）：${first}`;
}

function lessonPage(c, it) {
  const page = Classroom.PAGES[c.id][it.id];
  const description = lessonDescription(it, page);
  const html = [
    `<a class="csie-back" href="index.html">‹ ${esc(c.name)}</a>`,
    text('h2', 'csie-course-title', c.name),
    tag('div', 'csie-room', tag('div', 'cr-main', nav(c.id, it.id)
      + tag('div', 'cr-body', tag('article', 'cr-page', [text('h3', 'cr-title', `${it.name}　${it.zh}`), ...lessonBody(c.id, it.id, page)].join('\n'))))),
  ].join('\n');
  return {
    path: `csie/${c.id}/${it.id}.html`, title: `${it.name}　${it.zh}｜${c.name}｜CSIE 課程｜IT24hr`, description, html,
    scripts: lessonScripts(c.id),
    jsonld: { '@type': 'Article', headline: `${it.name} ${it.zh}`, description, inLanguage: 'zh-Hant-TW', author: AUTHORS, image: `${SITE}assets/og-image.jpg`,
      isPartOf: { '@type': 'Course', name: c.name, url: `${SITE}csie/${c.id}/index.html` } },
  };
}

// 一門課的目錄：分組、每頁一張卡
function coursePage(c) {
  const PAGES = Classroom.PAGES[c.id];
  const html = [
    '<a class="csie-back" href="../index.html">‹ 所有課程</a>',
    text('h2', 'csie-course-title', c.name),
    text('p', 'csie-intro', c.note),
    ...Classroom.TOC[c.id].map(g => text('h3', 'csie-group', g.group) + tag('div', 'csie-courses', g.items.map((it) => {
      const inner = text('strong', '', `${it.name}　${it.zh}`) + text('small', '', PAGES[it.id] ? '開始讀' : '準備中');
      return PAGES[it.id] ? `<a class="csie-course" href="${it.id}.html">${inner}</a>` : tag('div', 'csie-course soon', inner);
    }).join(''))),
  ].join('\n');
  return {
    path: `csie/${c.id}/index.html`, title: `${c.name}｜CSIE 課程｜IT24hr`, description: `${c.name}的互動講義：${c.note}`, html, type: 'website',
    jsonld: { '@type': 'Course', name: c.name, description: c.note, inLanguage: 'zh-Hant-TW', isAccessibleForFree: true, provider: { '@type': 'Organization', name: 'IT24hr', sameAs: SITE } },
  };
}

// 課程目錄：七門課，開了的連到那門課
function indexPage() {
  const html = [
    text('p', 'csie-intro', '寫給想認識資訊工程的人：從高中生、準備 APCS 和大學申請，到準備證照、研究所考試的學生。'),
    tag('div', 'csie-courses', COURSES.map((c) => {
      const inner = text('strong', '', c.name) + text('span', '', c.note) + text('small', '', c.ready ? '開始讀' : '籌備中');
      return c.ready ? `<a class="csie-course" href="${c.id}/index.html">${inner}</a>` : tag('div', 'csie-course soon', inner);
    }).join('')),
  ].join('\n');
  return {
    path: 'csie/index.html', title: 'CSIE 課程｜IT24hr', type: 'website', html,
    description: `${readyCourses().map(c => c.name).join('、')}的免費互動講義：每頁有圖解、可以按的沙盒或一行一行跑的程式追蹤器，和四種語言的程式。`,
  };
}

function staticPages() {
  return [indexPage(), ...readyCourses().flatMap(c => [coursePage(c), ...written(c.id).map(it => lessonPage(c, it))])];
}

module.exports = { staticPages, lessonScripts };
