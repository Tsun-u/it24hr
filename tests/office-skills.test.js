// tests/office-skills.test.js（node --test）：正式上班的「寫 Skill」——hybrid、speedrun 都能在 CLAIRE.md 新增規範；
// 跟新人訓練第三天共用同一份（部署流程、整理需求的讀法），寫過的（CLAIRE.md 裡有那條）不再列
const test = require('node:test');
const assert = require('node:assert');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');
require('../sandbox-scenery.js');
const DAY3 = require('../day3.js');

const PLAYER = { name: '測試', title: '工程師' };
const play = (level, mode, carry = {}) => new Engine(Sandbox.make(level, mode, { pool: ['trace', 'stock'], ...carry }), PLAYER);
const ids = (e) => e.skills().map(s => s.id);
const stances = (e) => e.skills().find(s => s.id === 'readReq').options.map(o => o.stance);

test('正式上班 hybrid、speedrun 每一關都能寫 Skill：部署流程、整理需求的讀法（原則、情緒化兩句）；legacy 沒有 AI 就沒有', () => {
  for (const level of ['blur', 'scenery']) {
    for (const mode of ['hybrid', 'speedrun']) {
      const e = play(level, mode);
      assert.deepStrictEqual(ids(e), ['deploy', 'readReq'], `${level} ${mode}`);
      assert.deepStrictEqual(stances(e), ['principle', 'emotional'], `${level} ${mode}：過於細節那句點名第三天的案子，不帶來`);
      assert.ok(e.skills().find(s => s.id === 'readReq').options.every(o => o.say && o.text));
    }
    assert.deepStrictEqual(play(level, 'legacy').skills(), [], `${level} legacy`);
  }
});

test('寫了就是 CLAIRE.md 的一條筆記，清單上不再列；過於細節派正式上班寫不了', () => {
  const e = play('scenery', 'speedrun');
  assert.ok(e.addSkill('deploy'));
  assert.strictEqual(e.ai.notes.deploy.stance, 'skill');
  assert.match(e.ai.notes.deploy.text, /部署：先備份/);
  assert.deepStrictEqual(ids(e), ['readReq']);
  assert.strictEqual(e.addSkill('readReq', 'detail'), null);
  assert.ok(e.addSkill('readReq', 'emotional'));
  assert.strictEqual(e.ai.notes.readReq.stance, 'emotional');
  assert.deepStrictEqual(ids(e), []);
  assert.deepStrictEqual(e.aiNotes().map(n => n.topic), ['deploy', 'readReq']);
});

test('第三天寫過的 Skill 跟著全域 CLAIRE.md 帶進正式上班：寫過的不再列', () => {
  const day3 = new Engine(DAY3.make(), PLAYER);
  assert.ok(day3.addSkill('deploy'));
  const e = play('scenery', 'hybrid', { notes: day3.ai.notes });
  assert.deepStrictEqual(e.ai.notes.deploy, day3.ai.notes.deploy);
  assert.deepStrictEqual(ids(e), ['readReq']);
});

test('第三天照舊：同一條部署流程，整理需求的讀法三句（原則、過於細節、情緒化）', () => {
  const day3 = new Engine(DAY3.make(), PLAYER);
  const office = play('scenery', 'speedrun');
  const skill = (e, id) => e.script.ai.skills.find(s => s.id === id);
  assert.deepStrictEqual(skill(day3, 'deploy'), skill(office, 'deploy'));
  assert.deepStrictEqual(stances(day3), ['principle', 'detail', 'emotional']);
  assert.match(skill(day3, 'readReq').options[1].say, /區塊鏈/);
  const shared = (e) => skill(e, 'readReq').options.filter(o => o.stance !== 'detail');
  assert.deepStrictEqual(shared(day3), shared(office));
});
