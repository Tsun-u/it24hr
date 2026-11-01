const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Atlas = require('../atlas.js');
const Glossary = require('../glossary.js');

test('IT 圖鑑：每個分頁都有插圖檔和替代文字', () => {
  for (const tab of Atlas.TABS) {
    assert.ok(tab.alt, tab.id);
    assert.ok(fs.existsSync(path.join(__dirname, '..', tab.art)), tab.art);
  }
});

test('IT 圖鑑：四個分頁，每個職稱都有名稱和一行說明', () => {
  assert.strictEqual(Atlas.TABS.length, 4);
  for (const tab of Atlas.TABS) {
    assert.ok(tab.id && tab.name && tab.en, tab.id);
    assert.ok(tab.jobs.length >= 3, `${tab.name} 至少三個職稱`);
    for (const job of tab.jobs) assert.ok(job.title && job.desc, `${tab.name}：${job.title}`);
  }
  assert.strictEqual(Atlas.INTRO.length, 2);
  assert.strictEqual(Atlas.NOTES.length, 1);
});

test('IT 圖鑑：連到新人手冊的 term 都存在', () => {
  for (const tab of Atlas.TABS) for (const job of tab.jobs) {
    if (job.term) assert.ok(Glossary.get(job.term), `${job.title} → ${job.term}`);
  }
});
