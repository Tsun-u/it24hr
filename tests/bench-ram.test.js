const test = require('node:test');
const assert = require('node:assert');
const { BenchRam: R } = require('../bench-ram.js');

const BOX = [{ gen: 'DDR4', form: 'DIMM', size: 8 }, { gen: 'DDR3', form: 'DIMM', size: 4 }, { gen: 'DDR5', form: 'DIMM', size: 16 }, { gen: 'DDR4', form: 'SO-DIMM', size: 8 }];
const run = (state, ...actions) => actions.reduce((acc, a) => {
  const out = R.apply(acc.state, a);
  return { state: out.state, says: [...acc.says, out.say], events: [...acc.events, ...out.events] };
}, { state, says: [], events: [] });
const fresh = () => R.init(BOX);
// 照順序關機、斷電、拆側板：最短路的前半段
const opened = () => run(fresh(),
  { type: 'screen', target: 'save' }, { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'shutdownDone' },
  { type: 'plug' }, { type: 'screw', i: 0 }, { type: 'screw', i: 1 }, { type: 'screw', i: 2 }, { type: 'panel', holding: false }).state;
const withNew = (s) => R.take(s, 'box0');   // 料箱裡的 DDR4

test('一開始：舊的 DDR4 插在 A2，料箱四條，電腦開著、報價單沒存', () => {
  const s = fresh();
  assert.deepStrictEqual(s.sticks.map(x => [x.id, x.where]), [['old', 'A2'], ['box0', 'box'], ['box1', 'box'], ['box2', 'box'], ['box3', 'box']]);
  assert.strictEqual(R.label(s.sticks[4]), 'DDR4 8GB', '貼紙不寫外形');
  assert.strictEqual(s.powered, true); assert.strictEqual(s.excel, 'unsaved');
  assert.strictEqual(R.label(s.sticks[0]), 'DDR4 8GB');
});

test('每條記憶體都有貼紙和缺口位置：貼紙照真的格式寫世代和速度，不寫外形；世代不同缺口不同', () => {
  const s = fresh();
  assert.deepStrictEqual(s.sticks[0].sticker, ['8GB DDR4-2666', 'PC4-21300']);
  assert.deepStrictEqual(s.sticks[2].sticker, ['4GB DDR3-1600', 'PC3-12800']);
  assert.deepStrictEqual(s.sticks[4].sticker, s.sticks[0].sticker, 'SO-DIMM 的貼紙跟桌機的一樣，要看長短');
  assert.strictEqual(new Set(s.sticks.slice(0, 4).map(x => x.notch)).size, 3, 'DDR3、DDR4、DDR5 缺口位置各不同');
});

test('先存檔再從開始關機：不會喊 Excel', () => {
  const r = run(fresh(), { type: 'screen', target: 'save' }, { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'shutdownDone' });
  assert.strictEqual(r.state.powered, false); assert.strictEqual(r.state.excel, 'closed'); assert.strictEqual(r.state.dirty, false);
  assert.ok(!r.events.includes('lostExcel'));
});

test('沒存就從開始關機：先問要不要儲存；選不要儲存，關完君傑喊', () => {
  let r = run(fresh(), { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' });
  assert.strictEqual(r.state.prompt, true); assert.strictEqual(r.state.powered, true);
  r = run(r.state, { type: 'screen', target: 'promptDiscard' }, { type: 'shutdownDone' });
  assert.ok(r.events.includes('lostExcel'));
  assert.match(r.says.at(-1), /欸欸欸！我的 Excel 還沒存！/);
  assert.strictEqual(r.state.dirty, false);
});

test('問要不要儲存時選儲存：存好再關，選取消：不關機', () => {
  const save = run(fresh(), { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'screen', target: 'promptSave' }, { type: 'shutdownDone' });
  assert.ok(!save.events.includes('lostExcel')); assert.strictEqual(save.state.powered, false);
  const cancel = run(fresh(), { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'screen', target: 'promptCancel' });
  assert.strictEqual(cancel.state.powered, true); assert.strictEqual(cancel.state.prompt, false);
});

test('開著按電源鈕、拔電源線、關 PSU 開關：都是強制關機，下次開機先檢查磁碟', () => {
  for (const type of ['power', 'plug', 'psu']) {
    const r = run(fresh(), { type });
    assert.strictEqual(r.state.powered, false, type); assert.strictEqual(r.state.dirty, true, type);
    assert.ok(r.events.includes('lostExcel'), type);
  }
});

test('關機途中斷電：照強制關機算，關機完成那一步不再做', () => {
  const r = run(fresh(), { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'screen', target: 'promptDiscard' }, { type: 'plug' }, { type: 'shutdownDone' });
  assert.strictEqual(r.state.dirty, true); assert.strictEqual(r.state.shuttingDown, false);
  assert.strictEqual(r.events.filter(e => e === 'lostExcel').length, 1);
});

test('強制關機後開機：先檢查磁碟，檢查完才報容量', () => {
  let r = run(fresh(), { type: 'power' }, { type: 'power' });
  assert.strictEqual(r.state.check, 'running'); assert.strictEqual(r.state.shown, null);
  r = run(r.state, { type: 'checkDone' });
  assert.strictEqual(r.state.check, null); assert.strictEqual(r.state.dirty, false); assert.strictEqual(r.state.shown, 8);
  assert.match(r.says.at(-1), /磁碟檢查完了，螢幕顯示 8 GB，新的那條還沒裝。/);
});

test('沒插電、PSU 關著按電源鈕：沒反應，各有一句', () => {
  const off = opened();
  assert.match(R.apply(off, { type: 'power' }).say, /電源線沒插/);
  const psuOff = run(fresh(), { type: 'screen', target: 'save' }, { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'shutdownDone' }, { type: 'psu' }).state;
  assert.match(R.apply(psuOff, { type: 'power' }).say, /電源供應器的開關關著/);
});

test('側板：螺絲沒鬆完拆不下來；側板拆著螺絲鎖不回去；第一次拆掉回報 opened', () => {
  const s = run(fresh(), { type: 'screw', i: 0 }).state;
  assert.match(R.apply(s, { type: 'panel', holding: false }).say, /還有 2 顆螺絲/);
  const r = run(fresh(), { type: 'screw', i: 0 }, { type: 'screw', i: 1 }, { type: 'screw', i: 2 }, { type: 'panel', holding: false });
  assert.strictEqual(r.state.panelOff, true); assert.ok(r.events.includes('opened'));
  assert.match(R.apply(r.state, { type: 'screw', i: 0 }).say, /側板還沒裝回去/);
  assert.match(R.apply(r.state, { type: 'panel', holding: true }).say, /手上還拿著記憶體/);
});

test('插記憶體：側板還在、還有電、方向反了、世代不對、外形不對、槽有東西，都插不進去', () => {
  const s = withNew(opened());
  assert.ok(R.apply(withNew(fresh()), { type: 'insert', stick: 'box0', slot: 'B2', flipped: false }).events.includes('refused:panel'));
  const powered = run(s, { type: 'plug' }).state;
  assert.ok(R.apply(powered, { type: 'insert', stick: 'box0', slot: 'B2', flipped: false }).events.includes('refused:power'));
  assert.ok(R.apply(s, { type: 'insert', stick: 'box0', slot: 'B2', flipped: true }).events.includes('refused:flipped'));
  const ddr3 = R.take(s, 'box1');
  const wrongGen = R.apply(ddr3, { type: 'insert', stick: 'box1', slot: 'B2', flipped: false });
  assert.ok(wrongGen.events.includes('refused:gen')); assert.match(wrongGen.say, /轉過來也對不上/);
  const sodimm = R.apply(R.take(s, 'box3'), { type: 'insert', stick: 'box3', slot: 'B2', flipped: false });
  assert.ok(sodimm.events.includes('refused:form')); assert.match(sodimm.say, /短一截/);
  assert.ok(R.apply(s, { type: 'insert', stick: 'box0', slot: 'A2', flipped: false }).events.includes('refused:occupied'));
});

test('手上沒拿記憶體就點插槽：桌上有的叫你拿起來，桌上沒有的叫你回去拿', () => {
  assert.match(R.apply(opened(), { type: 'insert', slot: 'B2', flipped: false }).say, /回座位從舊料箱拿/);
  assert.match(R.apply(withNew(opened()), { type: 'insert', slot: 'B2', flipped: false }).say, /先點桌上的記憶體拿起來/);
});

test('新的插 B2（跟舊的同一組）：開機 16 GB 雙通道，安裝成功', () => {
  let r = run(withNew(opened()), { type: 'insert', stick: 'box0', slot: 'B2', flipped: false });
  assert.ok(r.events.includes('seated')); assert.strictEqual(r.state.sticks.find(x => x.id === 'box0').where, 'B2');
  r = run(r.state, { type: 'plug' }, { type: 'power' });
  assert.strictEqual(r.state.shown, 16); assert.strictEqual(R.memoryText(r.state), '16 GB（雙通道）');
  assert.ok(r.events.includes('installed')); assert.match(r.says.at(-1), /安裝成功，可以回報君傑了/);
});

test('插 DDR4 4GB 桌機用的：12 GB，比原本多就算裝好', () => {
  const s = R.take(run(R.init([{ gen: 'DDR4', form: 'DIMM', size: 4 }]), { type: 'screen', target: 'save' }, { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'shutdownDone' },
    { type: 'plug' }, { type: 'screw', i: 0 }, { type: 'screw', i: 1 }, { type: 'screw', i: 2 }, { type: 'panel', holding: false }).state, 'box0');
  const r = run(s, { type: 'insert', stick: 'box0', slot: 'B2', flipped: false }, { type: 'plug' }, { type: 'power' });
  assert.strictEqual(r.state.shown, 12); assert.ok(r.events.includes('installed'));
  assert.match(r.says.at(-1), /螢幕顯示 12 GB，安裝成功/);
});

test('插錯槽（A1）：一樣 16 GB，但只有單通道', () => {
  const r = run(withNew(opened()), { type: 'insert', stick: 'box0', slot: 'A1', flipped: false }, { type: 'plug' }, { type: 'power' });
  assert.strictEqual(R.memoryText(r.state), '16 GB（單通道）');
});

test('螢幕線拔掉時開機看不到容量，插回去才報', () => {
  let r = run(withNew(opened()), { type: 'insert', stick: 'box0', slot: 'B2', flipped: false }, { type: 'display' }, { type: 'plug' }, { type: 'power' });
  assert.ok(!r.events.includes('installed')); assert.match(r.says.at(-1), /螢幕黑黑的/);
  r = run(r.state, { type: 'display' });
  assert.ok(r.events.includes('installed'));
});

test('君傑自己動手：側板拆了才拔舊的放桌上；只裝新的 8 GB，兩條都裝回去 16 GB', () => {
  assert.ok(!R.apply(fresh(), { type: 'diy' }).events.includes('diy'));
  let r = run(withNew(opened()), { type: 'diy' });
  assert.ok(r.events.includes('diy')); assert.strictEqual(r.state.sticks.find(x => x.id === 'old').where, 'desk');
  r = run(r.state, { type: 'insert', stick: 'box0', slot: 'A2', flipped: false }, { type: 'plug' }, { type: 'power' });
  assert.match(r.says.at(-1), /螢幕顯示 8 GB，只認到一條/);
  r = run(r.state, { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'shutdownDone' }, { type: 'plug' },
    { type: 'insert', stick: 'old', slot: 'B2', flipped: false }, { type: 'plug' }, { type: 'power' });
  assert.strictEqual(r.state.shown, 16);
});

test('拔記憶體：開著不能拔、有電不能拔，斷電才拔得出來', () => {
  const on = run(fresh(), { type: 'screw', i: 0 }, { type: 'screw', i: 1 }, { type: 'screw', i: 2 }, { type: 'panel', holding: false }).state;
  assert.match(R.apply(on, { type: 'pull', stick: 'old' }).say, /電腦還開著/);
  assert.match(R.apply(on, { type: 'look', stick: 'old' }).say, /貼紙寫著 DDR4 8GB/);
  const r = R.apply(opened(), { type: 'pull', stick: 'old' });
  assert.ok(r.events.includes('pulled')); assert.strictEqual(r.state.sticks.find(x => x.id === 'old').where, 'desk');
});

test('拿起記憶體：只講貼紙，狀態不變', () => {
  const s = withNew(opened());
  const r = R.apply(s, { type: 'pick', stick: 'box0' });
  assert.match(r.say, /貼紙：DDR4 8GB/); assert.deepStrictEqual(r.state, s);
});

test('料箱：拿一條放手上，換拿另一條時原本那條放回去', () => {
  let s = R.take(fresh(), 'box0');
  assert.strictEqual(s.sticks.find(x => x.id === 'box0').where, 'hand');
  s = R.take(s, 'box1');
  assert.deepStrictEqual(s.sticks.filter(x => x.where === 'hand').map(x => x.id), ['box1']);
  assert.strictEqual(s.sticks.find(x => x.id === 'box0').where, 'box');
  s = R.stow(s);
  assert.ok(s.sticks.every(x => x.id === 'old' || x.where === 'box'));
});

test('整箱搬：料箱裡每條都到手上，放回時整箱放回', () => {
  let s = R.takeAll(fresh());
  assert.ok(s.sticks.filter(x => x.id !== 'old').every(x => x.where === 'hand'));
  s = R.stow(s);
  assert.ok(s.sticks.filter(x => x.id !== 'old').every(x => x.where === 'box'));
});

test('君傑能不能工作：電腦開著才能', () => {
  assert.strictEqual(R.blocked(fresh()), false);
  assert.strictEqual(R.blocked(opened()), true);
});
