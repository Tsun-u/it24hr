const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const fromJunjie = (e) => e.docs.filter(d => d.from === '業務 君傑' && d.kind !== 'sent');
const afterAsk = () => { const e = play(); tickTo(e, C.DAY_START_MIN + 22); return e; };
const pick = (e, id, text) => e.talk(id, e.talkOptions(id).find(o => o.say.startsWith(text)).i);
const waitReply = (e) => tickTo(e, e.clock.minute + 7);

test('君傑還沒開口前不能找他聊；開口之後通訊錄有君傑和阿賢', () => {
  const e = play();
  assert.deepStrictEqual(e.talkOptions('junjie'), []);
  tickTo(e, C.DAY_START_MIN + 22);
  assert.deepStrictEqual(e.contacts().map(c => c.who), ['業務 君傑', '資產室 阿賢']);
  assert.strictEqual(e.talkOptions('junjie').length, 4);
});

test('傳出去之後等他回才能再傳；回覆在 3～6 分鐘之間', () => {
  const e = afterAsk(); const before = fromJunjie(e).length; const sentAt = e.clock.minute;
  pick(e, 'junjie', '你的記憶體是 DDR 幾');
  assert.deepStrictEqual(e.talkOptions('junjie'), [], '等回覆中');
  assert.ok(e.docs.some(d => d.kind === 'sent' && d.text === '你的記憶體是 DDR 幾？'), '傳出去的話留在 LIME');
  tickTo(e, sentAt + 2); assert.strictEqual(fromJunjie(e).length, before);
  tickTo(e, sentAt + 6); assert.strictEqual(fromJunjie(e).at(-1).text, 'DDR 不是跳舞機嗎？');
});

test('選錯劃掉、留在同一輪；選對進下一輪', () => {
  const e = afterAsk();
  pick(e, 'junjie', '你的記憶體是 DDR 幾'); waitReply(e);
  assert.ok(!e.talkOptions('junjie').some(o => o.say.startsWith('你的記憶體')));
  assert.strictEqual(e.talkOptions('junjie').length, 3);
  pick(e, 'junjie', '同時按 Ctrl'); waitReply(e);
  assert.ok(e.talkOptions('junjie').some(o => o.say.startsWith('沒不見')), '第二輪：Excel 不見了');
});

test('六輪全選對：拿到清楚的照片，結束在 answered', () => {
  const e = afterAsk();
  for (const t of ['同時按 Ctrl', '沒不見', '再按一次 Ctrl、Shift、Esc，點上面', '反光了', '你拍到自己了', '阿明的電腦跟你的不一樣']) { pick(e, 'junjie', t); waitReply(e); }
  assert.strictEqual(fromJunjie(e).at(-1).photo, 'clear');
  assert.strictEqual(e.talkState('junjie').ended, 'answered');
  assert.deepStrictEqual(e.talkOptions('junjie'), []);
});

test('第六輪信了阿明：結束在 trusted，沒有清楚的照片', () => {
  const e = afterAsk();
  for (const t of ['同時按 Ctrl', '沒不見', '再按一次 Ctrl、Shift、Esc，點上面', '反光了', '你拍到自己了', '好，那我拿 DDR3']) { pick(e, 'junjie', t); waitReply(e); }
  assert.strictEqual(e.talkState('junjie').ended, 'trusted');
  assert.ok(!fromJunjie(e).some(d => d.photo === 'clear'));
});

test('照片：反光、拍到自己都是照片訊息', () => {
  const e = afterAsk();
  for (const t of ['同時按 Ctrl', '沒不見', '再按一次 Ctrl、Shift、Esc，點上面', '反光了']) { pick(e, 'junjie', t); waitReply(e); }
  assert.deepStrictEqual(fromJunjie(e).filter(d => d.photo).map(d => d.photo), ['glare', 'selfie']);
});

test('請阿賢調資料：一小時後收到信，規格寫 DDR4 桌機', () => {
  const e = afterAsk(); const at = e.clock.minute;
  e.talk('axian', 0);
  tickTo(e, at + 59); assert.ok(!e.docs.some(d => d.from === '資產室 阿賢' && d.origin === 'mail'));
  tickTo(e, at + 61);
  const mail = e.docs.find(d => d.from === '資產室 阿賢' && d.origin === 'mail');
  assert.match(mail.text, /DDR4/); assert.match(mail.text, /DIMM/);
});

test('阿賢寄信的同時在 LIME 說一聲，對話不會停在玩家傳的那句', () => {
  const e = afterAsk(); const at = e.clock.minute;
  e.talk('axian', 0);
  tickTo(e, at + 61);
  const chat = e.docs.filter(d => d.from === '資產室 阿賢' && d.origin === 'line' && d.kind !== 'sent');
  assert.strictEqual(chat.length, 1); assert.match(chat[0].text, /信箱/);
});

test('搬著整箱走路，一趟多 2 分鐘；拿一條走路不會', () => {
  const e = play(); e.takeAllSticks('ram'); const at = e.clock.minute;
  e.walk('junjie');
  assert.strictEqual(e.clock.minute, at + C.WALK_MIN + C.BOX_WALK_EXTRA_MIN);
  const e2 = play(); e2.takeStick('ram', e2.benchState('ram').sticks.find(s => s.where === 'box').id); const at2 = e2.clock.minute;
  e2.walk('junjie');
  assert.strictEqual(e2.clock.minute, at2 + C.WALK_MIN);
});

test('料箱隨機：一定有一條 DDR4 8GB 桌機用，另外 2～3 條，種子不同內容不同', () => {
  const { box } = Sandbox.make('blur', 'legacy').chores.find(c => c.id === 'ram');
  for (const seed of [0, 0.3, 0.7, 0.99]) {
    const sticks = box(() => seed);
    assert.ok(sticks.some(s => s.gen === 'DDR4' && s.form === 'DIMM' && s.size === 8), String(seed));
    assert.ok(sticks.length >= 3 && sticks.length <= 4, String(seed));
  }
  const looks = new Set([0, 0.3, 0.7, 0.99].map(seed => JSON.stringify(box(() => seed))));
  assert.ok(looks.size > 1);
});

test('君傑開口後一分鐘補一句暗示：這台是當初阿賢那邊貼編號的', () => {
  const e = play(); tickTo(e, C.DAY_START_MIN + 22);
  assert.ok(fromJunjie(e).some(d => /阿賢那邊貼編號/.test(d.text)));
});

// 一個人可以有好幾個話題（阿賢同時管記憶體和印表機的財產資料）：通訊錄只列一次，選項合起來，各話題自己等回覆
const withPrinterTopic = () => {
  const script = Sandbox.make('blur', 'legacy');
  script.talks = { ...script.talks, axian_printer: { who: '資產室 阿賢', replyBy: 'mail', delay: [15, 15],
    rounds: [{ options: [{ say: '淑芬那邊的印表機型號？', end: 'asked', back: { title: '印表機', text: 'MP LazyJet C8763' } }] }] } };
  const e = new Engine(script, { name: '測試', title: '工程師' });
  tickTo(e, C.DAY_START_MIN + 22);
  return e;
};

test('同一個人兩個話題：通訊錄只列一次，選項合起來、各自標是哪個話題', () => {
  const e = withPrinterTopic();
  const axian = e.contacts().filter(c => c.who === '資產室 阿賢');
  assert.strictEqual(axian.length, 1);
  assert.deepStrictEqual(axian[0].ids.sort(), ['axian', 'axian_printer']);
  const options = e.contactOptions('資產室 阿賢');
  assert.ok(options.some(o => o.talkId === 'axian_printer' && o.say.startsWith('淑芬那邊')));
  assert.ok(options.some(o => o.talkId === 'axian'));
});

test('一個話題在等回覆時，另一個話題照樣能傳；回覆時間跟著話題走', () => {
  const e = withPrinterTopic();
  const printer = e.contactOptions('資產室 阿賢').find(o => o.talkId === 'axian_printer');
  e.talk('axian_printer', printer.i);
  assert.ok(e.contactOptions('資產室 阿賢').some(o => o.talkId === 'axian'), '記憶體那個話題還能傳');
  assert.strictEqual(e.contactWaiting('資產室 阿賢'), 'mail');
  const sent = e.clock.minute;
  tickTo(e, sent + 14);
  assert.ok(!e.docs.some(d => d.origin === 'mail' && d.text === 'MP LazyJet C8763'));
  tickTo(e, sent + 15);
  assert.ok(e.docs.some(d => d.origin === 'mail' && d.text === 'MP LazyJet C8763'));
  assert.strictEqual(e.contactWaiting('資產室 阿賢'), null);
});
