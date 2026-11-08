// 審卡頁（card-review.js）的純資料部分：成品畫面要畫哪幾種樣子、每種樣子的卡怎麼造、後果寫成哪句話
const test = require('node:test');
const assert = require('node:assert');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-fate.js');
const Screen = require('../screen.js');
const { cardsOf } = require('../card-links.js');
const { outcomeText, previewCard, previewPage, rightPicks, shotVariants, voiceOf } = require('../card-review.js');

const fate = Sandbox.make('fate', 'legacy', { pool: 'all' });
const entries = cardsOf(fate);
const specOf = (id) => entries.find(e => e.id === id && !e.parallel).card;
const mother = previewCard(specOf('fate'), rightPicks(specOf('fate')));

test('每日一籤的成品畫面：正解、前端沒做、前端換成有後果的選項、後端填錯會改格子的', () => {
  const titles = shotVariants(specOf('lot')).map(v => v.title);
  assert.equal(titles[0], '照正解做');
  assert.ok(titles.includes('前端程式沒做'));
  assert.ok(titles.includes('前端程式「求籤的過程」選「按一下直接出籤」'));
  assert.ok(titles.includes('前端程式「籤詩解說」選「只顯示籤號」'));
  assert.ok(titles.includes('後端程式 throwJiao「擲出什麼」選「每次都是聖筊」'));
});

test('照正解做有擲筊和解籤的儀式畫面，按一下直接出籤就沒有擲筊', () => {
  const [right, ...wrongs] = shotVariants(specOf('lot'));
  const ritualsOf = (v) => Screen.model(previewCard(specOf('lot'), v.picks), mother).rituals.map(r => r.kind || r);
  assert.deepEqual(ritualsOf(right), ['jiao', 'fog']);
  assert.ok(!ritualsOf(wrongs.find(v => v.title.includes('按一下直接出籤'))).includes('jiao'));
});

test('後端程式填錯：那個 function 算 bug，成品畫面照劇本的 bugs 改格子', () => {
  const v = shotVariants(specOf('lot')).find(x => x.title.startsWith('後端程式 throwJiao'));
  const m = Screen.model(previewCard(specOf('lot'), v.picks), mother);
  assert.ok(m.bugNotes.some(n => n.cells && n.cells['擲筊'] === '聖筊'));
});

test('第三關每張卡（含平行宇宙小卡）的每種樣子都造得出成品畫面', () => {
  for (const e of entries) for (const v of shotVariants(e.card)) {
    const parent = e.card.parent ? mother : null;
    assert.doesNotThrow(() => Screen.userVoice(Screen.model(previewCard(e.card, v.picks), parent)), `${e.id}：${v.title}`);
  }
});

test('每張卡的每種樣子都畫得出頁面（不是 404）', () => {
  const hasCode = (c) => c.subtasks.some(s => s.work === 'code');
  for (const e of entries) {
    const sample = (entries.find(c => !c.parallel && c.card.parent === e.id && hasCode(c.card)) || {}).card;
    const parent = e.card.parent && specOf(e.card.parent);
    for (const v of shotVariants(e.card)) {
      const { page, parent: under } = previewPage(e.card, v.picks, parent, sample);
      assert.ok(Screen.model(page, under).built, `${e.id}：${v.title}`);
    }
  }
});

test('母議題是網站首頁：選單、三位老師的排法、配色都照前端程式那幾題', () => {
  const variants = shotVariants(specOf('fate'));
  const home = (title) => Screen.model(previewCard(specOf('fate'), variants.find(v => v.title === title).picks));
  const right = home('照正解做');
  assert.equal(right.template, 'home');
  assert.deepEqual(right.rituals, ['bagua']);
  assert.deepEqual([right.home.nav, right.home.order], ['wheel', 'center']);
  assert.deepEqual(right.home.teachers.center, ['莉莉絲老師', '瀞玄老師', '熙恩教授']);
  assert.equal(home('前端程式「版面」選「一般的上方導覽列」').home.nav, 'bar');
  assert.equal(home('前端程式「三位老師的排序」選「三位一樣大、照筆畫排」').home.order, 'strokes');
  assert.notDeepEqual(home('前端程式「配色」做成天書').theme, right.theme, '天書換了配色');
  const skipped = home('前端程式沒做');
  assert.deepEqual([skipped.template, skipped.home.nav, skipped.home.order], ['plain', 'bar', 'strokes']);
});

test('用的人怎麼說照結算卡的規則：第三關照正解講功力在流動，前端沒做（照常理）講真的準嗎', () => {
  const [right, skipped] = shotVariants(specOf('lot'));
  assert.deepEqual(voiceOf(fate, specOf('lot'), right.picks, specOf('fate')), ['客人：「感受到老師的功力在網站中流動。」']);
  assert.deepEqual(voiceOf(fate, specOf('lot'), skipped.picks, specOf('fate')), ['客人：「感覺很普通，算出來的內容真的準嗎？」']);
});

test('後果寫成一句話：種類、誰、說了什麼，驗收和無障礙跟在後面', () => {
  assert.equal(outcomeText({ kind: 'displeased', who: '瀞玄老師', say: '都好。' }), '業主不滿（QC 不退）・瀞玄老師「都好。」');
  assert.equal(outcomeText({ kind: 'late', accept: 3 }), '上線後才出事；驗收勾了第 4 條，QC 就會退');
  assert.equal(outcomeText({ kind: 'gripe', a11y: { minus: 40, note: '找不到選單' } }), '阿姿抱怨（QC 不退）；無障礙扣 40 分（找不到選單）');
});
