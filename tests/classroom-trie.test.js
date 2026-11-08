// tests/classroom-trie.test.js（node --test）：小教室 Trie 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.trie;

// 從根往下把每個節點的名字（從根走到它的字母）和有沒有字尾標記收起來
const nodes = (node, id = '') => [[id, node.end], ...Object.keys(node.kids).sort().flatMap(ch => nodes(node.kids[ch], id + ch))];

test('Trie 沙盒：插入共用開頭、只長出新的節點；查字首輪流 ca、car、d、cab；五個字放完再插是錯誤且狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  const labels = [], added = [];
  for (let i = 0; i < 5; i++) { s = box.apply(s, 'insert'); labels.push(box.label('insert', s)); added.push(s.added); }
  assert.deepStrictEqual(labels, ['insert(cat)', 'insert(car)：共用 c、a', 'insert(card)：接在 car 後面', 'insert(care)：共用 c、a、r', 'insert(dog)：從根長出新的一枝']);
  assert.deepStrictEqual(added, [['c', 'ca', 'cat'], ['car'], ['card'], ['care'], ['d', 'do', 'dog']]);
  // 根加九個節點；有標記的剛好是插進去的五個字，car 是字、c、ca 不是
  const marked = nodes(s.trie).filter(([, end]) => end).map(([id]) => id);
  assert.strictEqual(nodes(s.trie).length, 10);
  assert.deepStrictEqual(marked, ['car', 'card', 'care', 'cat', 'dog']);

  const more = box.apply(s, 'insert');
  assert.strictEqual(more.error, 'allPlaced'); assert.match(box.errors.allPlaced, /查字首/);
  assert.strictEqual(more.trie, s.trie); assert.strictEqual(more.placed, 5);

  const asked = [];
  for (let i = 0; i < 5; i++) { s = box.apply(s, 'startsWith'); asked.push([box.label('startsWith', s), s.path]); }
  assert.deepStrictEqual(asked, [
    ['startsWith(ca) → car card care cat', ['c', 'ca']],
    ['startsWith(car) → car card care', ['c', 'ca', 'car']],
    ['startsWith(d) → dog', ['d']],
    ['startsWith(cab) → （沒有）', ['c', 'ca']],
    ['startsWith(ca) → car card care cat', ['c', 'ca']],
  ]);
  assert.ok(!s.error);
});

test('還沒插字就查字首：不是錯誤，查到的是（沒有）', () => {
  const box = page.sandbox;
  const s = box.apply(box.init(), 'startsWith');
  assert.strictEqual(s.error, null);
  assert.strictEqual(box.label('startsWith', s), 'startsWith(ca) → （沒有）');
  assert.deepStrictEqual(s.path, []);
});

test('分格靜態圖照操作重播：插入五個字，再查字首 ca', () => {
  const frames = CR.replay('ds', 'trie', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'insert(cat)',
    'insert(car)：共用 c、a',
    'insert(card)：接在 car 後面',
    'insert(care)：共用 c、a、r',
    'insert(dog)：從根長出新的一枝',
    'startsWith(ca) → car card care cat',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});

test('常見誤解舉的例子：孩子用 Map 存、不排序就走，列出來的是放進去的順序 cat car card care', () => {
  const root = { kids: new Map(), end: false };
  for (const w of ['cat', 'car', 'card', 'care', 'dog']) {
    let node = root;
    for (const ch of w) { if (!node.kids.has(ch)) node.kids.set(ch, { kids: new Map(), end: false }); node = node.kids.get(ch); }
    node.end = true;
  }
  const collect = (node, word) => [...(node.end ? [word] : []), ...[...node.kids].flatMap(([ch, kid]) => collect(kid, word + ch))];
  const ca = root.kids.get('c').kids.get('a');
  assert.deepStrictEqual(collect(ca, 'ca'), ['cat', 'car', 'card', 'care']);
  assert.match(page.traps.map(t => t.right).join(''), /cat car card care/);
});
