// 儀式感的成品畫面：前端程式題目的 ritual 選了才畫；母議題選的是整個網站的門面，子議題也帶
const test = require('node:test');
const assert = require('node:assert');
const Screen = require('../screen.js');

const ui = (items, picks) => ({ subtasks: [{ work: 'ui_design', question: { items } }], picks: { ui_design: picks } });
const ritualItem = (ritual) => ({ text: '過程', options: ['儀式', '一般'], answer: 0, ritual });
const card = (pick, ritual = { 0: 'jiao' }) => ({ id: 'lot', title: '每日一籤', history: [], screen: { app: '每日一籤', fields: [], rows: [] }, ...ui([ritualItem(ritual)], [pick]) });

test('選了儀式那個選項才有那一塊', () => {
  assert.deepEqual(Screen.model(card(0)).rituals, ['jiao']);
  assert.deepEqual(Screen.model(card(1)).rituals, []);
});

test('一個選項可以畫好幾塊（寫陣列）', () => {
  assert.deepEqual(Screen.model(card(0, { 0: ['formula', { kind: 'fog', say: '完整能量報告請預約' }] })).rituals, ['formula', { kind: 'fog', say: '完整能量報告請預約' }]);
});

test('沒做前端程式就沒有', () => {
  const c = card(0); delete c.picks;
  assert.deepEqual(Screen.model(c).rituals, []);
});

test('帶字的寫法原樣交給畫面（例：霧掉接預約的按鈕字）', () => {
  const r = { kind: 'fog', say: '請老師為您解籤' };
  assert.deepEqual(Screen.model(card(0, { 0: r })).rituals, [r]);
});

test('母議題選的網站門面，子議題的畫面也有', () => {
  const parent = { id: 'fate', ...ui([ritualItem({ 0: 'bagua' })], [0]) };
  const m = Screen.model(card(1), parent);
  assert.deepEqual(m.siteRituals, ['bagua']);
  assert.deepEqual(m.rituals, []);
  assert.deepEqual(Screen.model(card(1), { ...parent, picks: { ui_design: [1] } }).siteRituals, []);
});

test('網站門面扣的無障礙分數，子議題每一頁都算', () => {
  const nav = { text: '版面', options: ['圓盤選單', '導覽列'], answer: 0, ritual: { 0: 'bagua' },
    outcome: { 0: { kind: 'gripe', a11y: { minus: 25, note: '選單藏在要轉的圓盤裡' } }, 1: { kind: 'displeased', say: '一目了然。' } } };
  const parent = (pick) => ({ id: 'fate', ...ui([nav], [pick]) });
  const score = (p) => Screen.lighthouse(Screen.model(card(1), p)).accessibility;
  assert.equal(score(parent(1)) - score(parent(0)), 25);
  assert.ok(Screen.lighthouse(Screen.model(card(1), parent(0))).notes.includes('選單藏在要轉的圓盤裡'));
});

test('只改格子、扣分的後果沒有台詞：用的人怎麼說不會多出空的一句', () => {
  const nav = { text: '版面', options: ['圓盤選單', '導覽列'], answer: 0, outcome: { 0: { kind: 'gripe', a11y: { minus: 25, note: '選單藏在要轉的圓盤裡' } } } };
  const says = Screen.userVoice(Screen.model(card(1), { id: 'fate', ...ui([nav], [0]) }));
  assert.ok(says.every(s => typeof s === 'string' && s.length));
});

test('十一種儀式都有畫法', () => {
  assert.deepEqual([...Screen.RITUAL_KINDS].sort(), ['bagua', 'bird', 'comic', 'compass', 'fog', 'formula', 'jiao', 'scratch', 'shuwen', 'tarot', 'zodiac'].sort());
});
