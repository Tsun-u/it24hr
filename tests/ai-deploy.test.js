// tests/ai-deploy.test.js（node --test）：Accept Edits、Auto 的 AI 部署——備份它自己做（有機率忘），不可逆的步驟先問你
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Works = require('../works.js');

const deploy = (pick) => ({ work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
  items: [{ text: '步驟', type: 'order', options: ['備份', '上傳新版', '替換', '登入看一眼', '通知阿賢'], answer: [0, 1, 2, 3], ai: { pick } }] } });
const min = (n) => C.MS_PER_GAME_MIN * n;
const start = ({ pick = [0, 1, 2, 3, 4], permission = 'acceptEdits', id = 'k' } = {}) => {
  const e = new Engine({ mode: 'hybrid', ai: { quota: 3, turnaround: [10, 10], permission },
    cards: [{ at: 0, id, title: '平台', from: 'SA 怡君', assignee: '玩家', subtasks: [deploy(pick)] }] });
  e.tick(min(1));
  const lines = []; e.on('ai:deploying', (x) => lines.push(...x.lines.map(l => l.text)));
  return { e, lines, card: e.board.get(id), id };
};
const job = ({ card }) => card.ai.deploy.at(-1);
const ask = (g) => job(g).asks[job(g).asked];
const answer = (g, a) => { g.e.answerAi(g.id, 'deploy', job(g).id, a); g.e.tick(min(C.AI_ASK_GAP_MIN)); };
const delegate = (g) => { assert.ok(g.e.delegate(g.id, 'deploy')); g.e.tick(min(10)); };
// 這張卡的 AI 記得先備份（照機率擲出來沒忘）
const remembers = ['k', 'k2', 'k3', 'k4', 'k5', 'k6'].find(id => Works.aiRoll(`${id}:deploy:1:backup`) >= C.AI_FORGET_BACKUP);

test('Accept Edits：備份自己做，上傳、替換、測試、通知一步一步問；Y Y Y N 就照正確順序部署', () => {
  const g = start({ id: remembers });
  delegate(g);
  assert.ok(g.lines.some(t => t.startsWith('$ tar czf')), '先備份，不用問');
  assert.strictEqual(ask(g).text, '可以上傳嗎？');
  answer(g, true); assert.ok(g.lines.some(t => t.startsWith('$ scp')));
  assert.strictEqual(ask(g).text, '可以替換嗎？');
  answer(g, true); assert.strictEqual(ask(g).text, '需要測試嗎？（登入看一眼）');
  answer(g, true); assert.strictEqual(ask(g).text, '要不要通知？（通知阿賢）');
  answer(g, false);
  assert.ok(g.card.done('deploy'));
  assert.deepStrictEqual([g.card.noBackup, g.card.noSmoke, !!g.card.earlyNotify], [false, false, false]);
  assert.strictEqual(job(g).status, 'taken');
  assert.strictEqual(g.e.ai.left, 2, '整趟只扣一次額度');
  assert.deepStrictEqual(g.e.aiNotes(), [], '回答不寫進 CLAIRE.md');
});

test('沒有可以補做的步驟時，上傳選 N 只能中斷', () => {
  const g = start({ id: remembers });
  delegate(g); answer(g, false);
  assert.deepStrictEqual(ask(g).choices.map(c => c.value), ['stop']);
});

test('會忘記備份：劇本裡 AI 的排法沒備份的那張一定忘，其他照機率', () => {
  const g = start({ pick: [1, 2, 3, 4] });
  delegate(g);
  assert.ok(!g.lines.some(t => t.startsWith('$ tar czf')));
  assert.strictEqual(ask(g).text, '可以上傳嗎？');
  const other = start({ id: 'k' }); delegate(other);
  assert.strictEqual(other.lines.some(t => t.startsWith('$ tar czf')), Works.aiRoll('k:deploy:1:backup') >= C.AI_FORGET_BACKUP);
});

test('替換前發現沒備份選 N：修正 AI 流程，補做備份再問一次', () => {
  const g = start({ pick: [1, 2, 3, 4] });
  delegate(g); answer(g, true);
  answer(g, false);
  assert.deepStrictEqual(ask(g).choices.map(c => c.label), ['中斷 AI', '修正 AI 流程：補做備份']);
  answer(g, 'fix');
  assert.ok(g.lines.some(t => t.startsWith('$ tar czf')));
  assert.strictEqual(ask(g).text, '可以替換嗎？');
  answer(g, true); answer(g, true); answer(g, false);
  assert.strictEqual(g.card.noBackup, false, '上傳後、替換前補的備份，備到的還是舊版');
});

test('中斷 AI：停手，做過的步驟算數，剩下的自己排', () => {
  const g = start({ pick: [1, 2, 3, 4] });
  delegate(g); answer(g, true); answer(g, false); answer(g, 'stop');
  assert.strictEqual(job(g).status, 'stopped');
  assert.deepStrictEqual(g.card.aiDeployed, ['upload']);
  assert.strictEqual(g.card.done('deploy'), false);
  const run = g.e.doWork(g.id, 'deploy', [[0, 2, 3]]);   // 備份、替換、看一眼
  assert.ok(g.card.down == null, 'AI 上傳過了，替換不會 502');
  assert.strictEqual(g.card.noBackup, false);
  assert.ok(!run.terminal.some(l => l.text.startsWith('$ scp')), '不重複上傳');
  assert.strictEqual(g.card.aiDeployed, null);
});

test('答錯照樣有後果：沒備份就說可以替換、不測試、要通知', () => {
  const g = start({ pick: [1, 2, 3, 4] });
  delegate(g); answer(g, true); answer(g, true); answer(g, false); answer(g, true);
  assert.ok(g.card.done('deploy'));
  assert.deepStrictEqual([g.card.noBackup, g.card.noSmoke, g.card.earlyNotify], [true, true, true]);
});

test('Auto（第三天）也一樣：備份自己做，不可逆的步驟先問', () => {
  const g = start({ id: remembers, permission: 'auto' });
  delegate(g);
  assert.ok(g.lines.some(t => t.startsWith('$ tar czf')));
  assert.strictEqual(ask(g).text, '可以上傳嗎？');
});

test('不是 Accept Edits、Auto 的 AI 部署照舊交答案卡', () => {
  const g = start({ permission: null });
  delegate(g);
  assert.strictEqual(job(g).status, 'ready');
});
