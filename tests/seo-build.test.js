// tests/seo-build.test.js（node --test）：給搜尋引擎讀的靜態頁要跟內容同步——改了內容忘了重產就紅燈
const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { build, inline, SITE } = require('../scripts/build-seo.js');

const root = path.join(__dirname, '..');

test('repo 裡的靜態頁和 sitemap 跟重產的一樣（不一樣就跑 node scripts/build-seo.js）', () => {
  for (const [file, text] of build()) {
    const now = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    assert.strictEqual(now, text, `${file} 過期了`);
  }
});

test('每頁都有自己的標題、描述、canonical，sitemap 列出每一頁', () => {
  const out = build();
  const sitemap = out.get('sitemap.xml');
  for (const [file, text] of out) {
    if (!file.endsWith('.html')) continue;
    assert.match(text, /<title>.+｜IT24hr<\/title>/, file);
    assert.match(text, /<meta name="description" content=".{20,}">/, file);
    assert.ok(text.includes(`<link rel="canonical" href="${SITE}${file}">`), file);
    assert.ok(sitemap.includes(`<loc>${SITE}${file}</loc>`), `sitemap 少了 ${file}`);
  }
});

test('內文的 Markdown 轉成 HTML，特殊字元會跳脫', () => {
  assert.strictEqual(inline('**粗**、`a<b`、[連結](https://x.test/?a=1&b=2)'),
    '<strong>粗</strong>、<code>a&lt;b</code>、<a href="https://x.test/?a=1&amp;b=2">連結</a>');
});
