// tests/home-engine.test.js（node --test）：下班進茶几——選單、通勤、VPN、機密檔、睡覺、半夜的電話、結算
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');

const min = (n) => C.MS_PER_GAME_MIN * n;
const estimate = { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '估', ai: { pick: 2 } }] } };
const NIGHT_CALL = 24 * 60 + 2 * 60 + 47;
const script = ({ vpnDrop = 0, call = () => true, line = () => false, home = true } = {}) => ({
  mode: 'hybrid', mainCard: 'k', closeAt: 21 * 60,
  cards: [{ at: 0, id: 'k', title: '平台', from: 'SA 怡君', assignee: '玩家', requester: '阿賢', subtasks: [estimate] },
    { at: 600, id: 'late', title: '晚上才來的卡', from: 'SA 怡君', assignee: '玩家', subtasks: [estimate] }],
  ...(home ? { home: { commute: 30, pickupExtra: 15, deliveryWait: 40, vpnMin: 5, vpnDrop, ringMin: 20, emergencies: [
    { id: 'night_audit', at: 23 * 60 + 30, kind: 'line', from: '老闆', text: '今晚先給我', when: line },
    { id: 'night_login', at: NIGHT_CALL, kind: 'call', from: '阿賢', text: '登不進去', when: call,
      card: { id: 'night_login', title: '半夜：登不進去', from: '阿賢（電話）', subtasks: [estimate] } },
  ] } } : {}),
});
// 待到 18:00 下班
const offWork = (opts) => { const e = new Engine(script(opts)); e.tick(min(9 * 60)); e.leave(); return e; };
// 結算卡攤平成 lines；r() 拿到那天的結算卡，has(r, 字) 看有沒有那一行
const report = (e) => { let r = null; e.on('day:end', (x) => { r = x; }); return () => r; };
const has = (r, text) => r().lines.some(l => l.includes(text));

test('下班先進選單，時鐘停住；順路買多花時間、東西直接上桌', () => {
  const e = offWork();
  assert.deepStrictEqual([e.home.phase, e.home.menu, e.clock.isPaused], ['menu', 'dinner', true]);
  assert.strictEqual(e.ended, null);
  assert.strictEqual(e.goHome({ channel: 'pickup', order: { steak: 1 } }), null, '商圈沒有牛排');
  e.goHome({ channel: 'pickup', order: { bento: 2, bubble_tea: 1 }, laptop: true });
  assert.deepStrictEqual([e.home.phase, e.clock.label(), e.home.food], ['table', '18:45', { bento: 2, bubble_tea: 1 }]);
  assert.strictEqual(e.clock.isPaused, false);
});

test('外送：先到家，下班後 40 分鐘東西才到', () => {
  const e = offWork();
  e.goHome({ channel: 'delivery', order: { steak: 1 } });
  assert.deepStrictEqual([e.clock.label(), e.home.food], ['18:30', {}]);
  e.tick(min(10)); assert.deepStrictEqual(e.home.food, { steak: 1 });
});

test('21:00 被警衛趕：宵夜選單；沒寫 home 的劇本照舊直接結算', () => {
  const e = new Engine(script()); e.tick(min(12 * 60));
  assert.deepStrictEqual([e.home.menu, e.home.forced], ['lateNight', true]);
  const old = new Engine(script({ home: false })); const r = report(old); old.tick(min(12 * 60));
  assert.ok(r() && old.ended, '第一天沒有茶几');
});

test('在家沒連 VPN 不能做公司的事；連 5 分鐘；做完一件可能斷線', () => {
  const e = offWork({ vpnDrop: 1 }); e.goHome({ channel: 'pickup', order: {}, laptop: true });
  assert.strictEqual(e.doWork('k', 'estimate', [3]), null);
  e.vpnConnect(); assert.strictEqual(e.home.vpn, 'connecting');
  e.tick(min(5)); assert.strictEqual(e.home.vpn, 'on');
  assert.ok(e.doWork('k', 'estimate', [3]));
  assert.deepStrictEqual([e.home.vpn, e.home.drops, e.home.worked], ['off', 1, 1]);
});

test('在家公司停擺：劇本的新卡不進來、交了 QC 也不驗', () => {
  const e = offWork(); e.goHome({ channel: 'pickup', order: {} });
  e.tick(min(5 * 60));
  assert.strictEqual(e.board.get('late'), undefined, '19:00 的卡不會進來');
  e.vpnConnect(); e.tick(min(5));
  e.submit('k'); e.tick(min(C.QC_TURNAROUND_MIN + 1));
  assert.strictEqual(e.board.get('k').status, 'to_qc');
  e.sleep({ dnd: true }); assert.ok(e.ended, '睡到 08:00 結算');
  const { cards } = e.carryOver();
  assert.deepStrictEqual(cards.map(c => [c.id, c.status]), [['k', 'to_qc']], '在家交的卡帶到隔天給阿姿驗');
});

test('私人電腦做公司的事留機密檔，刪掉就沒事；睡覺時還在就上結算卡', () => {
  const e = offWork(); const r = report(e);
  e.goHome({ channel: 'pickup', order: {} });   // 沒帶公司筆電
  assert.strictEqual(e.useComputer('company'), null, '沒帶就不能換');
  e.vpnConnect(); e.tick(min(5)); e.doWork('k', 'estimate', [3]);
  assert.strictEqual(e.home.confidential.length, 1);
  e.sleep({ dnd: true });
  assert.ok(has(r, '資安稽核重點人物'));
  const clean = offWork(); const r2 = report(clean);
  clean.goHome({ channel: 'pickup', order: {} }); clean.vpnConnect(); clean.tick(min(5)); clean.doWork('k', 'estimate', [3]);
  clean.deleteConfidential(clean.home.confidential[0].id); clean.sleep({ dnd: true });
  assert.ok(has(r2, '用私人電腦碰過公司的事，機密檔都刪了'));
});

test('只用公司筆電＝公私分明；大胃王、小鳥胃寫在結算卡右欄的習慣與成就', () => {
  const e = offWork(); const r = report(e);
  e.goHome({ channel: 'pickup', order: { bento: 1, dry_noodles: 1, dumplings: 1, fried_rice: 1, bubble_tea: 1 }, laptop: true });
  e.sleep({ dnd: true });
  assert.ok(has(r, '公私分明：沒用私人電腦碰公司的事'));
  assert.ok(has(r, '大胃王：把商圈買光了'));
  assert.deepStrictEqual(r().traits.map(t => t.title).filter(t => ['大胃王', '公私分明'].includes(t)), ['大胃王', '公私分明']);
  assert.ok(!r().tally.some(t => /大胃王|公私分明/.test(t.text)), '成就不放左欄');
  assert.ok(has(r, '晚餐（商圈）：便當、乾麵、水餃、炒飯、手搖飲'));
  const bird = offWork(); const r2 = report(bird); bird.goHome({ channel: 'pickup', order: { bubble_tea: 1 } }); bird.sleep({ dnd: true });
  assert.ok(has(r2, '小鳥胃：下班幾乎沒吃東西'));
});

test('睡覺快轉；02:47 電話吵醒，接了桌上多一張卡、VPN 要重掛，再睡就到隔天 08:00 結算', () => {
  const e = offWork(); const r = report(e);
  e.goHome({ channel: 'pickup', order: {}, laptop: true }); e.vpnConnect(); e.tick(min(5));
  e.sleep();
  assert.strictEqual(e.clock.minute, NIGHT_CALL);
  assert.strictEqual(e.home.ringing.id, 'night_login');
  assert.ok(e.answerCall(true));
  assert.ok(e.board.get('night_login'));
  assert.strictEqual(e.home.vpn, 'off');
  e.sleep();
  assert.strictEqual(e.clock.label(), '08:00');
  assert.ok(r()); assert.ok(has(r, '下班：18:00'), '結算卡寫的是離開公司的時間');
});

test('下班休閒：選了才擺上茶几；開著就一直算，自己關掉才停，結算卡寫玩了多久', () => {
  const e = offWork(); const r = report(e);
  assert.strictEqual(e.goHome({ channel: 'pickup', order: {}, leisure: ['yacht'] }), null, '沒有這種休閒');
  e.goHome({ channel: 'pickup', order: {}, leisure: ['console', 'manga'] });
  assert.strictEqual(e.startPlay('tablet'), null, '沒選平板就沒得追劇');
  e.startPlay('console'); e.tick(min(90));
  assert.strictEqual(e.playedMinutes('console'), 90);
  e.stopPlay('console'); e.tick(min(30));
  assert.strictEqual(e.playedMinutes('console'), 90, '關掉就不算了');
  e.sleep({ dnd: true });
  assert.ok(has(r, '下班休閒：打電動 1 小時 30 分鐘'));
  const idle = offWork(); const r2 = report(idle);
  idle.goHome({ channel: 'pickup', order: {}, leisure: ['tablet'] }); idle.sleep({ dnd: true });
  assert.ok(has(r2, '下班休閒：平板擺在桌上，沒碰'));
});

test('電話來了也不停；不接也不掛，響 20 分鐘就算漏接；上床會把開著的休閒關掉', () => {
  const e = offWork(); const r = report(e);
  e.goHome({ channel: 'pickup', order: {}, leisure: ['manga'] });
  e.tick(min(NIGHT_CALL - 10 - e.clock.minute));
  e.startPlay('manga'); e.tick(min(10));
  assert.strictEqual(e.home.ringing.id, 'night_login');
  assert.ok(e.home.playing.manga != null, '電話響了，漫畫照看');
  e.tick(min(21));
  assert.strictEqual(e.home.ringing, null);
  assert.deepStrictEqual(e.home.missed.map(m => m.id), ['night_login']);
  e.sleep({ dnd: true });
  assert.ok(has(r, '下班休閒：看漫畫 31 分鐘'));
  assert.ok(has(r, '漏接：02:47 阿賢「登不進去」'));
});

test('免打擾就漏接；白天做好了就沒有半夜的事', () => {
  const e = offWork({ line: () => true }); const r = report(e);
  e.goHome({ channel: 'pickup', order: {} }); e.sleep({ dnd: true });
  assert.ok(has(r, '漏接：02:47 阿賢「登不進去」'));
  assert.ok(has(r, '老闆 23:30 的 LIME 還沒處理：「今晚先給我」'));
  const good = offWork({ call: () => false }); const r2 = report(good);
  good.goHome({ channel: 'pickup', order: {} }); good.sleep();
  assert.ok(!has(r2, '漏接'));
  assert.strictEqual(good.home.ringing, null);
});
