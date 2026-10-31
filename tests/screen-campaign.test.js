// tests/screen-campaign.test.js（node --test）：行銷部用 AI 做的活動頁——瑕疵都在，開發修了哪個哪個才消失
const test = require('node:test'); const assert = require('node:assert');
const Screen = require('../screen.js');

const SPEC = { app: '週年慶活動頁', campaign: true, defects: { brokenImages: 'fixImages', bannerOverButton: 'fixMobileButton', formOverflow: 'fixTabletForm' } };
const fns = [{ name: 'fixImages', fields: { how: {} } }, { name: 'fixMobileButton', fields: { how: {} } }, { name: 'fixTabletForm', fields: { how: {} } }];
const card = (history = []) => ({ title: 'x', screen: SPEC, subtasks: [{ work: 'code', question: { kind: 'functions', functions: fns } }], picks: null, history });

test('活動頁：還沒開發時三個瑕疵都在，客人三句都講', () => {
  const m = Screen.model(card());
  assert.ok(m.campaign && m.built && m.designed && m.template === 'campaign');
  assert.deepStrictEqual(Object.keys(m.effects).sort(), ['bannerOverButton', 'brokenImages', 'formOverflow']);
  const says = Screen.userVoice(m);
  assert.ok(says.some(s => /破的/.test(s)) && says.some(s => /按不到/.test(s)) && says.some(s => /左右捲/.test(s)));
});

test('活動頁：開發填對的 function 把瑕疵修掉，填錯的（bug）還在，沒填的也還在', () => {
  const m = Screen.model(card([{ work: 'code', result: { toFill: [0, 1], bugs: [{ fn: 'fixMobileButton', field: 'how' }] } }]));
  assert.deepStrictEqual(m.fixed, ['brokenImages']);
  assert.deepStrictEqual(Object.keys(m.effects).sort(), ['bannerOverButton', 'formOverflow']);
  const all = Screen.model(card([{ work: 'code', result: { toFill: [0, 1, 2], bugs: [] } }]));
  assert.deepStrictEqual(Object.keys(all.effects), []);
  assert.deepStrictEqual(Screen.userVoice(all), [Screen.PRAISE_LINE]);
});
