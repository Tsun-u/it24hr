// tests/ai-notes.test.js（node --test）：AI 筆記與退回（講要改什麼，講的話變成 AI 的筆記）
const test = require('node:test'); const assert = require('node:assert');
const W = require('../works.js');

const single = { text: '權限放哪', options: ['後端 API', '前端藏按鈕', '只放行阿賢'], answer: 0, ai: { pick: 1 },
  tags: { 0: 'auth:api', 1: 'auth:front', 2: 'auth:axian' } };
const multi = { text: '規格', options: ['角色表', '權限靠前端', '權限在 API', '忘記密碼'], answer: [0, 2], ai: { pick: [0, 1, 3] },
  tags: { 1: 'auth:front', 2: 'auth:api', 3: 'pwreset:yes' } };
const order = { text: '步驟', type: 'order', options: ['確認角色', 'AD', 'API 檢查', '測試', '部署', '忘記密碼'], answer: [0, 1, 2, 3, 4], ai: { pick: [1, 5, 3, 4] },
  tags: { 2: 'auth:api', 5: 'pwreset:yes' } };
const items = { items: [single, multi, order] };
const guard = { kind: 'functions', functions: [{ name: 'guardApi', judgment: true, claim: '前端藏按鈕就好',
  fields: { how: { label: '權限放哪', options: ['API', '前端', '只放行阿賢'], answer: 0, ai: { pick: 1 }, tags: { 0: 'auth:api', 1: 'auth:front', 2: 'auth:axian' } } } }] };
const aiWrong = () => W.aiAnswers(items, { accuracy: 0, seed: 's' }).answers;

test('套筆記：單選挑標了那做法的、多選只留做法相符的、排序照正解順序插進去', () => {
  assert.deepStrictEqual(aiWrong(), [1, [0, 1, 3], [1, 5, 3, 4]]);
  const api = W.applyNotes(items, aiWrong(), { auth: 'api' });
  assert.strictEqual(api[0], 0);
  assert.deepStrictEqual([...api[1]].sort(), [0, 2, 3]);
  assert.deepStrictEqual(api[2], [1, 2, 5, 3, 4]);
  const noPw = W.applyNotes(items, aiWrong(), { pwreset: 'no' });
  assert.deepStrictEqual(noPw[1], [0, 1]); assert.deepStrictEqual(noPw[2], [1, 3, 4]);
  assert.deepStrictEqual(W.applyNotes(items, aiWrong(), { auth: { stance: 'axian', text: 'API 只放行阿賢的帳號' } })[0], 2, '筆記可以帶 AI 口吻的字');
});

test('筆記寫「不碰」（skip）：那個主題一律擺爛——單選留白、多選拿掉', () => {
  const skip = W.applyNotes(items, aiWrong(), { auth: 'skip' });
  assert.strictEqual(skip[0], null); assert.deepStrictEqual(skip[1], [0, 3]); assert.deepStrictEqual(skip[2], [1, 5, 3, 4]);
});

test('AI 填答案先讀筆記；筆記蓋過它的主張（不記 claim）', () => {
  assert.deepStrictEqual(W.aiAnswers(guard, { accuracy: 1, seed: 's' }), { answers: [{ how: 1 }], errors: ['claim'] });
  assert.deepStrictEqual(W.aiAnswers(guard, { accuracy: 1, seed: 's', notes: { auth: 'api' } }), { answers: [{ how: 0 }], errors: [] });
  assert.deepStrictEqual(W.aiAnswers(guard, { accuracy: 1, seed: 's', notes: { auth: 'skip' } }).answers, [{ how: undefined }]);
  assert.deepStrictEqual(W.aiAnswers(items, { accuracy: 0, seed: 's', notes: { auth: 'axian' } }).answers[0], 2, '說錯它也照做');
});

test('退回時列出能圈的題目：劇本寫了補充說明就用劇本的，沒寫就自動給一句「應該是：正解」', () => {
  const scripted = { ...single, fixes: [{ say: '你權限根本亂做', set: { auth: 'skip' } }, { say: '權限檢查最好做在後端', set: { auth: 'api' } }] };
  const spots = W.aiSpots({ items: [scripted, multi] }, [1, [0, 1, 3]]);
  assert.deepStrictEqual(spots.map(s => s.key), ['i0', 'i1']);
  assert.strictEqual(spots[0].shown, '前端藏按鈕');
  assert.deepStrictEqual(spots[0].fixes.map(f => f.say), ['你權限根本亂做', '權限檢查最好做在後端']);
  assert.deepStrictEqual(spots[1].fixes, [{ say: '應該是：角色表、權限在 API', pick: [0, 2], set: { auth: 'api', pwreset: 'no' }, auto: true }]);
  const fn = W.aiSpots(guard, [{ how: 1 }]);
  assert.deepStrictEqual(fn.map(s => [s.key, s.label, s.shown]), [['f0.how', 'guardApi：權限放哪', '前端']]);
  assert.deepStrictEqual(W.aiSpots({ kind: 'entry', records: [] }, []), [], '資料登打不給退回');
});

test('請 AI 改：只改圈到的題目，其他維持原樣；有說法照說法改，只圈不說就照正確率重擲', () => {
  const base = [1, [0, 1, 3], [1, 5, 3, 4]];
  const told = W.reviseAnswers(items, base, [{ key: 'i0', fix: { say: '應該是：後端 API', pick: 0, set: { auth: 'api' } } }], { notes: { auth: 'api' }, accuracy: 0, seed: 'r' });
  assert.strictEqual(told[0], 0);
  assert.deepStrictEqual([...told[1]].sort(), [0, 2, 3], '筆記也套到同一份的其他題');
  const redo = W.reviseAnswers(items, base, [{ key: 'i0', fix: null }], { notes: {}, accuracy: 1, seed: 'r' });
  assert.strictEqual(redo[0], 0, '正確率 1：重做就對了'); assert.deepStrictEqual(redo[1], base[1], '沒圈的不動');
  assert.strictEqual(W.reviseAnswers(items, base, [{ key: 'i0', fix: null }], { notes: {}, accuracy: 0, seed: 'r' })[0], 1, '正確率 0：重做還是錯');
  const fn = W.reviseAnswers(guard, [{ how: 1 }], [{ key: 'f0.how', fix: { say: '你權限根本亂做', set: { auth: 'skip' } } }], { notes: { auth: 'skip' }, accuracy: 0, seed: 'r' });
  assert.deepStrictEqual(fn, [{ how: undefined }], '不碰就留白');
});

test('一個選項可以對應好幾種做法：做法列在裡面的筆記都選它；自動那句取第一個做法', () => {
  const approve = { text: '狀態什麼時候改', options: ['簽核過', '送出就改'], answer: 0, ai: { pick: 1 }, tags: { 0: 'approve:after,axian', 1: 'approve:submit' } };
  const q = { items: [approve] };
  assert.strictEqual(W.applyNotes(q, [1], { approve: 'axian' })[0], 0, '過於細節派：第二天剛好也對');
  assert.strictEqual(W.applyNotes(q, [1], { approve: 'after' })[0], 0);
  assert.strictEqual(W.applyNotes(q, [0], { approve: 'submit' })[0], 1, '反諷被當真');
  assert.deepStrictEqual(W.aiSpots(q, [1])[0].fixes[0].set, { approve: 'after' });
});

test('一個選項可以標好幾個主題：多選時每個主題的筆記都對得上才留著', () => {
  const plan = { text: '步驟', type: 'order', options: ['角色', 'AD', '寫測試', '部署', '忘記密碼'], answer: [0, 1, 2, 3], ai: { pick: [1, 4, 3] },
    tags: { 2: 'scope:spec', 4: ['pwreset:yes', 'scope:all'] } };
  const q = { items: [plan] };
  assert.deepStrictEqual(W.applyNotes(q, [[1, 4, 3]], { scope: 'spec' })[0], [1, 2, 3], '規格內的補進來、規格外的拿掉');
  assert.deepStrictEqual(W.applyNotes(q, [[1, 4, 3]], { pwreset: 'no' })[0], [1, 3]);
  assert.deepStrictEqual(W.applyNotes(q, [[1, 2, 4, 3]], { pwreset: 'yes', scope: 'spec' })[0], [1, 2, 3], '兩個主題有一個對不上就拿掉');
});

test('筆記做法是 ask（矯枉過正）：不照筆記改答案，交件前一題一題停下來問', () => {
  const ui = { text: '元件', options: ['登入框', '搜尋列', '匯出 Excel', '聊天機器人'], answer: [0, 1, 2], ai: { pick: [0, 1, 3] },
    tags: { 1: 'scope:spec', 2: 'scope:spec', 3: ['chatbot:yes', 'scope:all'] },
    askFirst: { 1: '需不需要加搜尋列？', 2: { text: '匯出 Excel 有在規格內嗎？', yes: '有', no: '沒有' }, 3: '要不要加聊天機器人？' } };
  const q = { items: [{ text: '估時', options: ['1 天', '1 週'], answer: 1 }, ui] };
  assert.deepStrictEqual(W.applyNotes(q, [0, [0, 1, 3]], { scope: 'ask' })[1], [0, 1, 3], 'ask 不改答案');
  assert.deepStrictEqual(W.firstAsks(q, { scope: 'spec' }), [], '沒有 ask 的筆記就不問');
  const asks = W.firstAsks(q, { scope: { stance: 'ask', text: '以後沒明講的先問' } });
  assert.deepStrictEqual(asks.map(a => [a.item, a.opt, a.text, a.yes, a.no]),
    [[1, 1, '需不需要加搜尋列？', '要', '不用'], [1, 2, '匯出 Excel 有在規格內嗎？', '有', '沒有'], [1, 3, '要不要加聊天機器人？', '要', '不用']]);
  let a = [0, [0, 1, 3]];
  a = W.applyAsk(q, a, asks[0], false); assert.deepStrictEqual(a[1], [0, 3]);
  a = W.applyAsk(q, a, asks[1], true); assert.deepStrictEqual(a[1], [0, 2, 3], '照正解順序插進去');
  a = W.applyAsk(q, a, asks[2], false); assert.deepStrictEqual(a, [0, [0, 2]]);
});

test('講的話變成筆記：劇本有 AI 口吻就用，沒有就用「記住：」加正解', () => {
  const topics = { auth: { skip: '以後權限我不碰，交給人類', api: '權限檢查一律做在後端 API' } };
  assert.deepStrictEqual(W.fixNotes({ say: '你權限根本亂做', set: { auth: 'skip' } }, topics), { auth: { stance: 'skip', text: '以後權限我不碰，交給人類' } });
  assert.deepStrictEqual(W.fixNotes({ say: '應該是：角色表、權限在 API', set: { auth: 'api', pwreset: 'no' }, auto: true }, topics),
    { auth: { stance: 'api', text: '權限檢查一律做在後端 API' }, pwreset: { stance: 'no', text: '記住：角色表、權限在 API' } });
});
