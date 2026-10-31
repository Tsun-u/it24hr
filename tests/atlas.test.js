const test = require('node:test');
const assert = require('node:assert');
const Atlas = require('../atlas.js');
const Glossary = require('../glossary.js');

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
