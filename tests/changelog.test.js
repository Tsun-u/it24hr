// tests/changelog.test.js（node --test）：版號與更新履歷
const test = require('node:test'); const assert = require('node:assert');
const fs = require('node:fs'); const path = require('node:path');
const Changelog = require('../changelog.js');
const { parseLog, COMMIT_SUBJECT } = require('../scripts/build-changelog.js');

test('git log 的每一行變成 hash、日期、說明，只寫履歷的 commit 不列', () => {
  const log = `abc1234\t2026-11-02\t首頁加版號\ndef5678\t2026-11-02\t${COMMIT_SUBJECT}\n0a1b2c3\t2026-11-01\t說明裡\t有定位字元\n`;
  assert.deepStrictEqual(parseLog(log), [
    { hash: 'abc1234', date: '2026-11-02', subject: '首頁加版號' },
    { hash: '0a1b2c3', date: '2026-11-01', subject: '說明裡\t有定位字元' },
  ]);
});

test('產生的資料：格式正確，由新到舊', () => {
  assert.ok(Changelog.ENTRIES.length);
  for (const entry of Changelog.ENTRIES) {
    assert.match(entry.hash, /^[0-9a-f]{7,}$/);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.subject && entry.subject !== COMMIT_SUBJECT);
  }
  for (let i = 1; i < Changelog.ENTRIES.length; i++) assert.ok(Changelog.ENTRIES[i - 1].date >= Changelog.ENTRIES[i].date);
});

test('首頁的版號取自最新一筆，同一天的排在一起', () => {
  assert.strictEqual(Changelog.LATEST, Changelog.ENTRIES[0]);
  const days = Changelog.byDate([{ date: '2026-11-02', hash: 'a' }, { date: '2026-11-02', hash: 'b' }, { date: '2026-11-01', hash: 'c' }]);
  assert.deepStrictEqual(days.map(([date, entries]) => [date, entries.map(e => e.hash)]), [['2026-11-02', ['a', 'b']], ['2026-11-01', ['c']]]);
});

test('首頁載入資料和畫面，順序在 app.js 前面', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const at = (name) => html.indexOf(`src="${name}"`);
  assert.ok(at('changelog-data.js') > 0 && at('changelog-data.js') < at('changelog.js') && at('changelog.js') < at('app.js'));
});
