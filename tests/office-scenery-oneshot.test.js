// tests/office-scenery-oneshot.test.js（node --test）：Pedia one shot——整張模組卡一次交給 Pedia，一天一次；文件照會議紀錄寫
const test = require('node:test');
const assert = require('node:assert');
const { C, Engine, Sandbox, play, at, tickTo, meetAll, skipMeeting } = require('./scenery-helpers.js');
const speed = () => meetAll(play('speedrun'));
// speedrun 的批號追溯要先選路：選從頭規劃，前端設計、開發跟一般的批號追溯一樣
const rebuild = (e, id) => { if (e.board.get(id).routes) e.doWork(id, 'route', [1]); return e; };
const ONE_SHOT = ['read_req', 'doc_plan', 'doc_spec', 'ui_design', 'doc_accept', 'code', 'test'];
const workOf = (card, job) => Object.keys(card.ai).find(w => card.ai[w].includes(job));

test('整張交給 Pedia：卡上能交辦的工作各一份（需求討論唯讀、估時、手動測試不算；CLAIRE.md 沒寫部署流程就不部署），最多 6 格、一天一次', () => {
  const e = speed(); const left = e.ai.left;
  const card = e.board.get('buy');
  assert.deepStrictEqual(e.oneShotWorks(card), ONE_SHOT);
  const jobs = e.oneShot('buy');
  assert.deepStrictEqual(jobs.map(j => workOf(card, j)), ONE_SHOT);
  assert.ok(jobs.every(j => j.model === 'Pedia' && j.group === 'oneshot'));
  assert.strictEqual(e.ai.left, left - 6, '剩下的照整組、單件加起來 15 格，超過 6 算 6');
  assert.deepStrictEqual(e.modelUses.Pedia, ['#401 收購計價（整張）']);
  assert.strictEqual(e.oneShot('yield'), null);
  assert.strictEqual(e.modelLack('Pedia'), 'Pedia 一天只能用一次。');
});
test('整組交辦挑 Pedia：文件組 5 格、開發組 4 格，也算一天一次；交了之後不能 one shot，one shot 過也不能再整組交', () => {
  let e = speed(); const left = e.ai.left;
  assert.ok(e.delegateGroup('buy', 'docs', 'Pedia').length > 1);
  assert.strictEqual(e.ai.left, left - 5);
  assert.deepStrictEqual(e.modelUses.Pedia, ['#401 文件']);
  assert.strictEqual(e.oneShot('yield'), null);
  const dev = speed(); dev.delegateGroup('buy', 'dev', 'Pedia');
  assert.strictEqual(dev.ai.left, left - 4);
  e = speed(); e.oneShot('buy');
  assert.strictEqual(e.delegateGroup('yield', 'docs', 'Pedia'), null);
  assert.strictEqual(e.groupCost('Novel', 'docs', 3), 5, '其他模型照舊：單件加總 −1');
});
test('整張的格數：one shot 會做的那幾件照整組、單件算加起來，超過 6 算 6', () => {
  const e = speed(); const card = e.board.get('buy');
  const price = (works) => { e.oneShotWorks = () => works; return e.oneShotCost(card); };
  assert.strictEqual(price(ONE_SHOT), 6);
  assert.strictEqual(price(['doc_plan', 'doc_spec', 'doc_accept']), 5, '只剩文件組');
  assert.strictEqual(price(['doc_spec', 'doc_accept']), 5, '文件組剩兩件也是整組價');
  assert.strictEqual(price(['test', 'code']), 4, '只剩開發組');
  assert.strictEqual(price(['deploy']), 3, '只剩一件照單件');
  assert.strictEqual(price(['doc_plan', 'doc_spec', 'doc_accept', 'test', 'code']), 6, '文件組＋開發組 9 格，算 6');
});
test('交件時間是單件加總打七折，一份接一份', () => {
  const e = speed(); const card = e.board.get('buy'); const start = e.clock.minute;
  const jobs = e.oneShot('buy');
  let sum = 0; const expect = ONE_SHOT.map(w => { sum += Math.round(e.aiMinutes(card, w, 1, 'Pedia') * C.AI_GROUP_TIME); return start + sum; });
  assert.deepStrictEqual(jobs.map(j => j.doneAt), expect);
});
test('Pedia 用過了（問一句、單件交辦、會議裡請它問都算）就不能 one shot；額度不夠也不行', () => {
  const used = speed(); used.delegate('yield', 'doc_plan', 'Pedia');
  assert.strictEqual(used.oneShot('buy'), null);
  const poor = speed(); poor.ai.left = 4;
  assert.strictEqual(poor.oneShot('buy'), null);
  assert.strictEqual(poor.modelUses.Pedia, undefined, '沒交出去不算用掉');
});
test('Pedia 交件：照卡上的順序一份接一份，後一份帶前一份；全部收下後，會議問到的步驟在計畫裡', () => {
  const e = speed(); e.oneShot('buy');
  tickTo(e, e.clock.minute + 200);
  const card = e.board.get('buy');
  for (const w of ONE_SHOT) { const job = (card.ai[w] || []).at(-1); assert.strictEqual(job.status, 'ready', w); e.acceptAi('buy', w, job.id); }
  assert.ok([3, 4].every(o => card.picks.doc_plan[0].includes(o)));
});
// 「單價帶行情」（選項 3）另外由整理需求撐著：整理需求寫了「單價每天照行情不一樣」，Pedia 寫的整理需求對，計畫就帶；
// 只有會議撐著的「重量換算」（選項 4）會不見，驗收的「台斤換公斤」案例（選項 2）跟著不見
test('會議沒問：Pedia 寫的計畫沒有「重量換算」那步，驗收也跟著沒有；整理需求撐著的「單價帶行情」還在', () => {
  const e = play('speedrun'); skipMeeting(e); e.oneShot('buy');
  tickTo(e, e.clock.minute + 200);
  const card = e.board.get('buy');
  for (const w of ['read_req', 'doc_plan', 'doc_spec', 'doc_accept']) e.acceptAi('buy', w, card.ai[w].at(-1).id);
  assert.ok(!card.picks.doc_plan[0].includes(4));
  assert.ok(card.picks.doc_plan[0].includes(3));
  assert.ok(!card.picks.doc_accept[0].includes(2));
});
test('初次玩正式上班 speedrun：第一張模組卡到的時候，提示可以整張交給 Pedia；不是第一次就沒有', () => {
  assert.deepStrictEqual(Sandbox.make('scenery', 'speedrun', { firstSpeedrun: true }).hints.map(h => h.after), ['card:arrived:buy']);
  assert.deepStrictEqual(Sandbox.make('scenery', 'speedrun', {}).hints, []);
  assert.deepStrictEqual(Sandbox.make('scenery', 'legacy', { firstSpeedrun: true }).hints, []);
});
test('提示不暫停時鐘；按了 one shot 就收起來', () => {
  const e = new Engine(Sandbox.make('scenery', 'speedrun', { firstSpeedrun: true, pool: ['trace', 'stock'] }), { name: '測試', title: '工程師' });
  meetAll(e);   // tickTo 只放開暫停（dismissHint），提示還掛著
  assert.match(e.hint.text, /整張交給 Pedia/);
  assert.strictEqual(e.hint.pause, false);
  e.oneShot('buy');
  assert.strictEqual(e.hint, null);
});
// CLAIRE.md 寫了部署流程（寫 Skill）：第三天寫的跟著全域 CLAIRE.md 帶進來
const DEPLOY_NOTE = { deploy: { stance: 'skill', text: '部署：先備份，再上傳、替換，最後煙霧測試；通知等 QC 驗過，由人按。' } };
const withDeploySkill = (mode = 'speedrun') => meetAll(play(mode, { pool: ['trace', 'stock'], notes: DEPLOY_NOTE }));
test('CLAIRE.md 有部署流程：one shot 照卡上的順序把部署排在最後；當天才寫的也算，沒寫就不部署', () => {
  const e = withDeploySkill(); const card = e.board.get('buy');
  assert.deepStrictEqual(e.oneShotWorks(card), [...ONE_SHOT, 'deploy']);
  assert.deepStrictEqual(e.oneShot('buy').map(j => workOf(card, j)), [...ONE_SHOT, 'deploy']);
  const today = speed(); assert.ok(today.addSkill('deploy'));
  assert.strictEqual(today.oneShotWorks(today.board.get('buy')).at(-1), 'deploy');
});
test('Pedia 照部署流程一步做到底：備份、上傳、替換、煙霧測試，不通知、不停下來問；文件和程式照舊等你收下', () => {
  const e = withDeploySkill(); const deploy = e.oneShot('buy').at(-1);
  tickTo(e, deploy.doneAt + 1);
  const card = e.board.get('buy');
  assert.ok(card.done('deploy'));
  assert.deepStrictEqual(deploy.deploy.done, ['backup', 'upload', 'replace', 'smoke']);
  assert.strictEqual(deploy.status, 'taken');
  assert.ok(!card.earlyNotify && !card.noBackup && !card.noSmoke);
  assert.ok(ONE_SHOT.every(w => card.ai[w].at(-1).status === 'ready'));
});
test('第二關單件交給 AI 部署：沒寫部署流程停在終端機一步一步問，寫了照流程做完（劇本沒寫 AI 怎麼排也照樣跑）', () => {
  for (const mode of ['hybrid', 'speedrun']) {
    const ask = meetAll(play(mode)); const job = ask.delegate('buy', 'deploy', 'Essay');
    tickTo(ask, job.doneAt + 1);
    assert.strictEqual(job.status, 'asking', mode);
    const auto = withDeploySkill(mode); const done = auto.delegate('buy', 'deploy', 'Essay');
    tickTo(auto, done.doneAt + 1);
    assert.ok(auto.board.get('buy').done('deploy'), mode);
  }
});
test('legacy、hybrid 沒有 one shot', () => {
  for (const mode of ['legacy', 'hybrid']) { const e = meetAll(play(mode)); assert.strictEqual(e.oneShot('buy'), null, mode); }
});
test('Pedia 一天最多花關卡額度的六成（6 格）：退回請它改也算，還沒到就能用、花到或超過之後才擋；14:00 額度補滿不歸零', () => {
  const e = speed(); const wrong = [{ key: 'i0', fix: null }];
  const job = e.delegate('buy', 'doc_plan', 'Pedia');
  tickTo(e, job.doneAt + 1);
  const r = e.reviseAi('buy', 'doc_plan', job.id, job.answers, wrong);
  assert.ok(r, '單件 3 格＋退一次 3 格＝6 格，還在上限內');
  assert.strictEqual(e.modelSpent.Pedia, 6);
  tickTo(e, r.job.doneAt + 1);
  assert.strictEqual(e.aiLack('Pedia'), 'Pedia 額度已達上限，請選擇其他模型接手。');
  assert.strictEqual(e.reviseAi('buy', 'doc_plan', r.job.id, r.job.answers, wrong), null);
  tickTo(e, at(14, 1));
  assert.strictEqual(e.ai.left, e.ai.max, '14:00 額度補滿');
  assert.match(e.aiLack('Pedia'), /已達上限/);
  assert.strictEqual(e.aiLack('Essay'), null, '其他模型照常');
  const all = speed(); all.oneShot('buy');
  tickTo(all, all.clock.minute + 200);
  const plan = all.board.get('buy').ai.doc_plan.at(-1);
  assert.strictEqual(all.reviseAi('buy', 'doc_plan', plan.id, plan.answers, wrong), null, '整張剛好 6 格就到上限');
  const group = speed(); group.delegateGroup('buy', 'docs', 'Pedia');
  tickTo(group, group.clock.minute + 200);
  const spec = group.board.get('buy').ai.doc_spec.at(-1);
  assert.ok(group.reviseAi('buy', 'doc_spec', spec.id, spec.answers, wrong), '文件組 5 格還沒到上限，可以退');
  assert.strictEqual(group.modelSpent.Pedia, 8, '這次衝過 6 格');
  assert.match(group.aiLack('Pedia'), /已達上限/);
});

// 交付重點：按「整張交給 Pedia」先問重點放在哪，三句每張卡同一組；選錯時 Pedia 往那個方向做到底（暫時筆記，不進 CLAIRE.md）
const DIRECTION = Object.fromEntries(C.ONE_SHOT_FOCUS.options.filter(o => o.kinds).map(o => [o.id, o.kinds]));
const takeAll = (e, id, works = ONE_SHOT) => { const card = e.board.get(id); for (const w of works) e.acceptAi(id, w, card.ai[w].at(-1).id); return card; };
// 有這個方向的錯法時它是哪個選項（照 kinds 的順序找第一個有的），沒有就是 undefined
const wrongWay = (outcome, kinds) => { for (const k of kinds) { const o = Object.keys(outcome || {}).find(x => outcome[x].kind === k); if (o !== undefined) return Number(o); } return undefined; };
test('交付重點的題目：三句、每張卡同一組', () => {
  assert.strictEqual(C.ONE_SHOT_FOCUS.question, '這張要 Pedia 把重點放在哪？');
  assert.deepStrictEqual(C.ONE_SHOT_FOCUS.options.map(o => [o.id, o.text]), [
    ['site', '照現場的習慣：跟著他們平常的講法和做法，不合格式的也收得進去、事後補得回來'],
    ['strict', '資料一定要對：格式不對就擋下來'],
    ['loose', '越彈性越好：現場怎麼打都收'],
  ]);
});
test('選「照現場的習慣」跟原本的 one shot 一樣；終端機只印一次：指令帶著選的那句，下一行列出要做的事和總時間', () => {
  const plain = speed(); plain.oneShot('buy');
  const site = speed(); const shown = []; site.on('ai:started', ({ lines }) => shown.push(...lines.map(l => l.text)));
  const jobs = site.oneShot('buy', 'site');
  tickTo(plain, plain.clock.minute + 200); tickTo(site, site.clock.minute + 200);
  for (const w of ONE_SHOT) assert.deepStrictEqual(site.board.get('buy').ai[w].at(-1).answers, plain.board.get('buy').ai[w].at(-1).answers, w);
  const minutes = jobs.at(-1).doneAt - jobs[0].startedAt;
  assert.deepStrictEqual(shown, [`$ claire --model pedia --issue 401 --one-shot --focus "${C.ONE_SHOT_FOCUS.options[0].text}"`,
    `Claire Code（Pedia 5）接手 #401 收購計價整張：整理需求 → 開發計畫文件 → 開發規格文件 → 前端設計 → 驗收文件 → 開發 → 寫測試程式，一份接一份，預計 ${minutes} 分鐘。`]);
});
test('整組交辦也只印一次：指令一行、要做的事一行', () => {
  const e = speed(); const shown = []; e.on('ai:started', ({ lines }) => shown.push(...lines.map(l => l.text)));
  const jobs = e.delegateGroup('buy', 'docs', 'Essay');
  assert.deepStrictEqual(shown, ['$ claire --issue 401 --task docs',
    `Claire Code（Essay 5）接手 #401 文件：開發計畫文件 → 開發規格文件 → 驗收文件，一份接一份，預計 ${jobs.at(-1).doneAt - jobs[0].startedAt} 分鐘。`]);
});
test('選錯重點：五張模組卡的前端設計、開發，有那個方向錯法的欄位都選到那個錯法，其他照正解', () => {
  for (const focus of ['strict', 'loose']) for (const id of ['buy', 'yield', 'shift', 'trace', 'stock']) {
    const e = rebuild(speed(), id); e.oneShot(id, focus); tickTo(e, e.clock.minute + 200);
    const card = e.board.get(id);
    const ui = card.subtasks.find(s => s.work === 'ui_design').question;
    const uiAnswers = card.ai.ui_design.at(-1).answers;
    ui.items.forEach((item, i) => {
      const way = wrongWay(item.outcome, DIRECTION[focus]);
      const want = way === undefined ? item.answer : Array.isArray(item.answer) ? [way] : way;
      assert.deepStrictEqual(uiAnswers[i], want, `${focus} ${id} 前端設計第 ${i} 題`);
    });
    const code = card.subtasks.find(s => s.work === 'code').question;
    const codeAnswers = card.ai.code.at(-1).answers;
    code.functions.forEach((f, i) => Object.entries(f.fields).forEach(([key, field]) => {
      const way = wrongWay(field.outcome, DIRECTION[focus]);
      if (way !== undefined && key in (codeAnswers[i] || {})) assert.strictEqual(codeAnswers[i][key], way, `${focus} ${id} ${f.name}`);
    }));
  }
});
test('選錯重點：收購計價收下後成品對不上過半，交 QC 骰到 10% 就開出員工內購', () => {
  for (const focus of ['strict', 'loose']) {
    const e = speed(); e.oneShot('buy', focus); tickTo(e, e.clock.minute + 200);
    const card = takeAll(e, 'buy');
    assert.ok(e.mismatch(card) > 0.5, `${focus}：${e.mismatch(card)}`);
    e.doWork('buy', 'deploy', card.subtasks.find(s => s.work === 'deploy').question.items.map(i => i.answer));
    e.random = () => 0; e.submit('buy'); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1);
    assert.ok(e.board.get('staff_buy'), focus);
  }
});
test('選錯重點不寫筆記：CLAIRE.md 跟交出去之前一樣', () => {
  const e = speed(); const before = JSON.stringify(e.ai.notes);
  e.oneShot('buy', 'loose'); tickTo(e, e.clock.minute + 200); takeAll(e, 'buy');
  assert.strictEqual(JSON.stringify(e.ai.notes), before);
});
test('沒選（取消）就不交：不扣額度、不算用掉 Pedia', () => {
  const e = speed(); const left = e.ai.left;
  assert.strictEqual(e.oneShot('buy', null), null);
  assert.strictEqual(e.oneShot('buy', 'whatever'), null);
  assert.strictEqual(e.ai.left, left);
  assert.strictEqual(e.modelUses.Pedia, undefined);
});
// 整張交給 Pedia、交付重點選錯，而且玩家沒改過任何 Pedia 的內容，交 QC 時一定擲平行宇宙（不看對不上多少）
const shotAll = (focus, id = 'trace') => {
  const e = rebuild(speed(), id); e.oneShot(id, focus);
  tickTo(e, e.clock.minute + 200);
  return { e, card: e.board.get(id) };
};
const takeShot = (e, card, skip = null) => { for (const w of card.oneShotRun.works) if (w !== skip) { const j = card.ai[w].at(-1); if (j.status === 'ready') e.acceptAi(card.id, w, j.id); } };
test('整張交給 Pedia、交付重點選錯、全部原樣收下：對不上沒過半也一定擲', () => {
  const { e, card } = shotAll('strict'); takeShot(e, card);
  assert.ok(e.mismatch(card) <= 0.5, `批號追溯選「資料一定要對」對不上 ${e.mismatch(card)}`);
  assert.strictEqual(e.untouchedWrongShot(card), true);
  e.random = () => 0; e.parallelRoll(card);
  assert.strictEqual(card.parallel, 'rolled');
});
test('選對重點、改過其中一份、退回請它改過、有一份沒收下：都照原本對不上過半才擲', () => {
  const site = shotAll('site'); takeShot(site.e, site.card);
  assert.strictEqual(site.e.untouchedWrongShot(site.card), false, '選對重點');
  const edited = shotAll('strict'); const ui = edited.card.ai.ui_design.at(-1);
  takeShot(edited.e, edited.card, 'ui_design');
  const changed = JSON.parse(JSON.stringify(ui.answers)); changed[0] = changed[0] === 0 ? 1 : 0;
  edited.e.doWork('trace', 'ui_design', changed, { by: 'ai', reviewed: true, jobId: ui.id });
  assert.strictEqual(edited.e.untouchedWrongShot(edited.card), false, '看了有改');
  const revised = shotAll('strict'); const plan = revised.card.ai.doc_plan.at(-1);
  assert.strictEqual(revised.e.reviseAi('trace', 'doc_plan', plan.id, plan.answers, [{ key: 'i0', fix: null }]), null, '整張 6 格已到 Pedia 上限，不能退回請它改');
  const partial = shotAll('strict'); takeShot(partial.e, partial.card, 'code');
  assert.strictEqual(partial.e.untouchedWrongShot(partial.card), false, '有一份沒收下');
  const looked = shotAll('strict'); const lui = looked.card.ai.ui_design.at(-1);
  takeShot(looked.e, looked.card, 'ui_design');
  looked.e.doWork('trace', 'ui_design', lui.answers, { by: 'ai', reviewed: true, jobId: lui.id });
  assert.strictEqual(looked.e.untouchedWrongShot(looked.card), true, '看了沒改照樣算原樣');
});
