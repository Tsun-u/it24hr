// tests/screen-day3.test.js（node --test）：第三天 POC 子議題的成品畫面——開發的 bug 變成莎禾的人看得到的效果
const test = require('node:test'); const assert = require('node:assert');
const Screen = require('../screen.js');
const DAY3 = require('../day3.js');

const cardOf = (id, bugs = [], picks = null) => {
  const c = DAY3.make().cards.find(x => x.id === id);
  return { title: c.title, screen: c.screen, subtasks: c.subtasks, picks, history: [{ work: 'code', result: { bugs } }] };
};
const bug = (fn) => ({ fn, field: 'x' });
// 前端設計照正解勾（poc_approve、poc_bot 有這件工作，沒勾就是 plain）
const designed = (id) => {
  const sub = DAY3.make().cards.find(x => x.id === id).subtasks.find(s => s.work === 'ui_design');
  return { ui_design: sub.question.items.map(it => it.answer) };
};

test('登入與權限：沒有前端設計也照盤點平台的畫面畫；接錯 AD、忘記密碼導錯、簽核鈕一般同仁也看得到', () => {
  const ok = Screen.model(cardOf('poc_login'));
  assert.ok(ok.designed && ok.components.login && ok.loginRequired && ok.pwReset);
  assert.match(ok.loginLabel, /莎禾 AD/);
  const bad = Screen.model(cardOf('poc_login', [bug('loginWith'), bug('forgotPassword'), bug('guardApi')]));
  assert.ok(bad.effects.wrongDomain && bad.effects.wrongReset && bad.effects.approveVisible);
  const says = Screen.userVoice(bad);
  assert.ok(says.some(s => /登不進去/.test(s)) && says.some(s => /別家公司/.test(s)) && says.some(s => /簽核鈕/.test(s)));
});

test('簽核照客戶的組織：簽核人寫成阿賢、編號沿用我們的格式、部門用我們的部門表，都反映在資料列上', () => {
  const ok = Screen.model(cardOf('poc_approve', [], designed('poc_approve')));
  assert.deepStrictEqual(Screen.visibleRows(ok)[0].slice(0, 3), ['A-0001', 'ThinkPad T14', '台北總部 財務處']);
  const bad = Screen.model(cardOf('poc_approve', [bug('approver'), bug('serialRule'), bug('deptSource')], designed('poc_approve')));
  const rows = Screen.visibleRows(bad);
  assert.strictEqual(rows[0][0], 'IT-2026-0001');
  assert.ok(rows.every(r => r[2] === '資產室'));
  assert.strictEqual(rows[1][5], '待阿賢簽核'); assert.strictEqual(rows[0][5], '已簽核');
  assert.ok(Screen.userVoice(bad).some(s => /阿賢是誰/.test(s)));
  assert.ok(!Screen.userVoice(ok, null).includes(Screen.STYLE_LINE), '照 CI 配色：不扣風格');
});

test('財務季報表（#128）：沒有介面要做也有畫面——既有的季報表多一欄折舊後金額，公式錯每列都對不上', () => {
  const src = DAY3.make().sources.find(s => s.id === 'finance_report');
  const card = (bugs) => ({ title: src.title, screen: src.screen, subtasks: src.subtasks, picks: null, history: [{ work: 'code', result: { bugs } }] });
  const ok = Screen.model(card([]));
  assert.ok(ok.designed && ok.readOnly, '照財務既有的報表畫');
  const net = ok.fields.indexOf('折舊後金額');
  assert.deepStrictEqual(Screen.visibleRows(ok).map(r => r[net]), ['28,000', '2,720', '3,500']);
  assert.ok(!Screen.userVoice(ok).some(s => /對不起來/.test(s)));
  const bad = Screen.model(card([bug('depreciatedValue')]));
  assert.deepStrictEqual(Screen.visibleRows(bad).map(r => r[net]), ['33,600', '5,440', '28,000']);
  assert.ok(Screen.userVoice(bad).some(s => /對不起來/.test(s)));
});

test('QA 機器人與 ERP 匯出：閒聊、漏資料、BOM、沒排程各有一句使用者的話', () => {
  const bot = Screen.model(cardOf('poc_bot', [bug('botScope'), bug('botSource')], designed('poc_bot')));
  assert.ok(bot.components.chat && bot.effects.botChatty && bot.effects.botLeaks);
  assert.strictEqual(bot.template, 'list', '前端設計沒有版型那題：預設清單頁，小視窗才畫得出來');
  assert.ok(Screen.userVoice(bot).some(s => /一首詩/.test(s)) && Screen.userVoice(bot).some(s => /別人名下/.test(s)));
  const erp = Screen.model(cardOf('poc_erp', [bug('exportEncoding'), bug('exportSchedule')]));
  assert.ok(erp.designed && erp.erpPreview && erp.effects.bomVisible && erp.effects.noSchedule);
  assert.ok(Screen.userVoice(erp).some(s => /怪字/.test(s)) && Screen.userVoice(erp).some(s => /什麼都沒有/.test(s)));
  assert.deepStrictEqual(Screen.userVoice(Screen.model(cardOf('poc_erp'))), [Screen.PRAISE_LINE]);
});

test('資安與合規：沒有前端設計也照盤點平台畫；套件升錯了篩選、匯出按了沒反應（第二天資安卡同一個效果）', () => {
  const ok = Screen.model(cardOf('poc_compliance'));
  assert.ok(ok.designed && ok.components.filter && ok.components.export && !ok.effects.jqueryBroken);
  const bad = Screen.model(cardOf('poc_compliance', [bug('upgradeDeps')]));
  assert.ok(bad.effects.jqueryBroken);
  assert.ok(DAY3.make().cards.find(c => c.id === 'poc_compliance').subtasks.some(s => s.work === 'manual_test'), '合規那張有手動測試可以自己翻出來');
});
