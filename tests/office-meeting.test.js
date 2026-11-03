// tests/office-meeting.test.js（node --test）：第一關的早會——小潘那句可以舉手問舊料箱為什麼放你桌上，IT 經理最後一句等它有結果才講
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (minute) => C.DAY_START_MIN + minute;
const CLOSING = 'IT 經理：「測試，相信我，你很快會發現舊料箱擺在你桌上的好處。」';
const listen = (e) => { const said = []; e.on('meeting:line', (line) => said.push(line.text)); return said; };

test('小潘那句可以舉手，三個問法小潘各回一句；台詞換上玩家的名字', () => {
  const e = play(); tickTo(e, at(5));
  const line = e.meeting.current;
  assert.ok(line.key);
  assert.match(line.text, /放在測試的座位上/);
  assert.deepStrictEqual(line.options.map(o => o.reply), [
    '同事 小潘：「你的桌面比較乾淨。」',
    '同事 小潘：「會議桌要保持淨空。」',
    '同事 小潘：「我的桌面已經有五箱了。」',
  ]);
});

test('舉手問了：小潘回完、經理講最後一句就散會', () => {
  const e = play(); const said = listen(e); tickTo(e, at(6));
  assert.ok(e.raiseHand(2));
  tickTo(e, at(9));
  assert.strictEqual(said.at(-1), CLOSING);
  tickTo(e, at(11));
  assert.strictEqual(e.meeting, null);
});

test('沒舉手：經理那句等小潘那句飛完才講，講完散會', () => {
  const e = play(); const said = listen(e);
  tickTo(e, at(5 + C.DANMAKU_FLY_MIN - 1));
  assert.ok(!said.includes(CLOSING), '小潘那句還在飛，經理還沒講');
  tickTo(e, at(5 + C.DANMAKU_FLY_MIN));
  assert.strictEqual(said.at(-1), CLOSING);
  tickTo(e, at(5 + C.DANMAKU_FLY_MIN + 2));
  assert.strictEqual(e.meeting, null);
});
