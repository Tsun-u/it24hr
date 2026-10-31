// tests/glossary.test.js（node --test）：新人手冊的術語與切法
const test = require('node:test'); const assert = require('node:assert');
const G = require('../glossary.js');

const terms = (text, seen) => G.segments(text, seen).filter(s => s.term).map(s => s.text);

test('切開來再接回去，字一個都不少', () => {
  const text = '請在週五前交給 QC 驗收，SA 說母議題下面還有兩張子議題。';
  assert.strictEqual(G.segments(text).map(s => s.text).join(''), text);
});

test('長的寫法先比：「母議題」不會被「議題」搶走、「驗收文件」整串算一個', () => {
  assert.deepStrictEqual(terms('這張母議題的驗收文件'), ['母議題', '驗收文件']);
  assert.deepStrictEqual(terms('開發計畫文件寫好了'), ['開發計畫文件']);
});

test('英文詞前後不能接英數字', () => {
  assert.deepStrictEqual(terms('SAVE 之後交給 SA'), ['SA']);
  assert.deepStrictEqual(terms('錯誤碼 1502，不是 502'), ['502']);
  assert.deepStrictEqual(terms('QC區'), ['QC']);   // 後面接中文可以
});

test('同一段只標第一次；seen 帶到下一段也算', () => {
  assert.deepStrictEqual(terms('QC 退件，QC 又退件'), ['QC', '退件']);
  const seen = new Set();
  assert.deepStrictEqual(terms('先問 SA', seen), ['SA']);
  assert.deepStrictEqual(terms('SA 還沒回', seen), []);
});

test('同一個詞的不同寫法算同一條：標了「煙霧測試」，後面的「smoke」不再標', () => {
  const segs = G.segments('煙霧測試就是 smoke test');
  assert.deepStrictEqual(segs.filter(s => s.term).map(s => s.term), ['smoke']);
});

test('每條都有類別、一句話、多知道一點；類別都在 GROUPS 裡', () => {
  for (const t of G.TERMS) {
    assert.ok(G.GROUPS.includes(t.group), `${t.id} 的類別 ${t.group}`);
    assert.ok(t.short && t.more, `${t.id} 少了解釋`);
  }
});

test('id 不重複，同一個寫法不會出現在兩條', () => {
  const ids = G.TERMS.map(t => t.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  const seen = new Map();
  for (const t of G.TERMS) for (const text of (t.match || [t.word])) {
    assert.ok(!seen.has(text), `「${text}」同時在 ${seen.get(text)} 和 ${t.id}`);
    seen.set(text, t.id);
  }
});

test('手冊標題：有全名的加括號', () => {
  assert.strictEqual(G.title(G.get('sa')), 'SA（System Analyst，系統分析師）');
  assert.strictEqual(G.title(G.get('estimate')), '估時');
  assert.strictEqual(G.get('nope'), null);
});
