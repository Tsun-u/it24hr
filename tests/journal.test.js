// tests/journal.test.js（node --test）：工作日誌——CLAIRE.md 攤平、拿過的成就、每個時代每一關最後一次的結算卡
const test = require('node:test');
const assert = require('node:assert');
const { Journal } = require('../journal.js');

const view = (traits, kind = 'Queue') => ({ report: { kind, traits } });

test('CLAIRE.md：主題底下是物件或字串都攤成一條一條', () => {
  assert.deepStrictEqual(Journal.notes({ deploy: { stance: 'rule', text: '部署先備份' }, plain: '文件寫人話' }),
    [{ topic: 'deploy', text: '部署先備份' }, { topic: 'plain', text: '文件寫人話' }]);
  assert.deepStrictEqual(Journal.notes(null), []);
});

test('成就：扣掉每天都有的習慣紀錄，同一個成就只列一次、寫最近在哪拿到', () => {
  const training = { reports: {
    day1: view([{ title: '便條', text: '看了' }, { title: '平板', text: '3%' }, { title: '測試', text: '先寫測試' }]),
    day3: view([{ title: '神人', text: '一天做完 MFA' }, { title: '公私分明', text: '都用公司電腦' }]),
  } };
  const office = { levels: { blur: { hybrid: { view: view([{ title: '公私分明', text: '都用公司電腦' }, { title: '提示', text: '按了 2 次' }]), at: '2026-11-03', plays: 1 } } } };
  const got = Journal.achievements(training, office, (id) => (id === 'blur' ? 'IT 的模糊邊界' : id));
  assert.deepStrictEqual(got.map(a => a.title), ['神人', '公私分明']);
  assert.strictEqual(got.find(a => a.title === '公私分明').where, 'IT 的模糊邊界・hybrid');
  assert.strictEqual(got.find(a => a.title === '神人').where, '新人訓練第三天');
});

test('時代分頁：每一關一列，玩過的帶最後一次紀錄，沒玩過的是 null', () => {
  const office = { levels: { blur: { legacy: { view: view([]), at: '2026-11-03', plays: 2 } } } };
  assert.deepStrictEqual(Journal.levels(office, 'legacy', ['blur', 'pos']).map(r => [r.id, r.last && r.last.plays]), [['blur', 2], ['pos', null]]);
  assert.deepStrictEqual(Journal.levels(null, 'speedrun', ['blur']).map(r => r.last), [null]);
});
