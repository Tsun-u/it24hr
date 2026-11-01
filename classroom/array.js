// classroom/array.js — 小教室「Array 陣列」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const MOVED = '#b5e3b0', MUTED = '#6b7280';
  // 箭頭：一條線＋兩撇箭頭，從 from 指到 to
  function arrow(INK, svg, rc, [x1, y1], [x2, y2], seed) {
    const angle = Math.atan2(y2 - y1, x2 - x1), head = 5;
    const wing = (turn) => [x2 - head * Math.cos(angle + turn), y2 - head * Math.sin(angle + turn)];
    const opt = { stroke: INK, strokeWidth: 1.4, roughness: 0.6, seed };
    svg.append(rc.line(x1, y1, x2, y2, opt), rc.linearPath([wing(0.6), [x2, y2], wing(-0.6)], opt));
  }

  const page = {
    analogy: '一排有編號的置物櫃：知道號碼就直接開。',
    summary: '下次站在一排置物櫃前面，你就知道：那是一個陣列，知道號碼直接開，要插到最前面就得整排往後搬。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['read', 'insertFront', 'append', 'read'],
    uses: [
      '音樂播放清單、手機相簿：照順序排成一排，點第 7 首就直接跳過去，不用從第 1 首聽起。',
      '試算表、成績表：一列一列排好的資料；有列有欄的表格就是二維陣列，寫成 a[列][欄]。',
      '一張照片：其實是像素排成的二維陣列，每格存一個顏色；修圖軟體要改哪個點，直接算出位置就改得到。',
      '電腦內部：記憶體本身就像一個超大的陣列，記憶體位置（address）就是索引；堆疊、佇列、雜湊表底下也常常是一個陣列。',
    ],
    concept: [
      '陣列（array）把資料一格接一格、連續地放在記憶體裡，每一格一樣大。每格有一個編號叫索引（index），從 0 開始：索引的意思是「離起點幾格」，第一格就在起點，所以是 a[0]；n 格的陣列最後一格是 a[n−1]。',
      '因為連續又一樣大，第 i 格在記憶體的哪裡可以直接算出來：起點位置＋i×每格的大小。讀第 0 格和讀第 999 格都只要算一次，所以讀任何一格都是 O(1)，這叫隨機存取（random access）。',
      '代價是插隊：要插到最前面，得先把後面每一格往後搬一格空出位子，n 格就搬 n 次（O(n)）；容量也在一開始就定好，滿了就放不下。下一頁的鏈結串列剛好相反：插到前面很快，要讀第幾個卻得從頭走。',
    ],
    complexity: [['讀或改第 i 格 a[i]', 'O(1)'], ['接到最後 append', 'O(1)'], ['插到最前面或中間 insert', 'O(n)'], ['刪掉最前面或中間那格', 'O(n)'], ['找某個值在不在裡面', 'O(n)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '第一格是 a[1]', right: '索引從 0 開始，第一格是 a[0]，n 格的陣列最後一格是 a[n−1]；寫成 a[n] 就超出範圍了。' },
      { wrong: '讀第 1000 格比讀第 1 格慢，因為要一格一格數過去', right: '不用數。位置是「起點＋索引×每格大小」直接算出來的，讀哪一格都一樣快，都是 O(1)。要從頭一個一個走的是下一頁的鏈結串列。' },
      { wrong: '插到最前面跟接到最後一樣，都是多放一格', right: '接到最後直接放進下一個空格，O(1)；插到最前面要先把後面每一格往後搬，n 格就搬 n 次，O(n)。刪掉最前面那格也一樣，後面要全部往前補。' },
      { wrong: '往後搬就從第一格開始搬', right: '要從最後一格開始倒著搬。從前面開始的話，a[0] 搬到 a[1] 的那一刻，原本的 a[1] 就被蓋掉了。考試手寫 insert 最常錯在這裡。' },
      { wrong: 'Python 的 list、JavaScript 的陣列會自己長大，所以沒有容量', right: '背後一樣是固定容量的陣列，只是放滿時程式幫你搬家：另外要一塊更大的記憶體，把舊的全部複製過去。搬家那一次是 O(n)，因為每次都多要一些空位，平均下來接到最後還是 O(1)。Java 的 ArrayList、C++ 的 vector 也是這樣。' },
      { wrong: '超出範圍讀一下也沒關係', right: '這叫越界存取（out of bounds）。Python 會報 IndexError，Java 會丟 ArrayIndexOutOfBoundsException；C++ 的 a[i] 不檢查（讀到旁邊的記憶體，結果無法預期，很多資安漏洞就是這樣來的），vector 要檢查得用 a.at(i)；JavaScript 讀到的是 undefined，寫進去還會把陣列撐長、中間留洞。' },
      { wrong: 'a[-1] 就是最後一格', right: '只有 Python 這樣（負的索引從後面數回來）。Java、C++ 的 a[-1] 是越界；JavaScript 的 a[-1] 是 undefined，要拿最後一格得寫 a[a.length − 1] 或 a.at(-1)。' },
    ],
    code: {
      python: {
        builtin: `a = [10, 20, 30]
a.insert(0, 40)
print(a[0], a[3], len(a))
`,
        handmade: `class FixedArray:
    def __init__(self, capacity):
        self.items = [None] * capacity
        self.size = 0

    def get(self, i):
        if not 0 <= i < self.size:
            raise IndexError("index out of range")
        return self.items[i]

    def append(self, x):
        if self.size == len(self.items):
            raise OverflowError("array is full")
        self.items[self.size] = x
        self.size += 1

    def insert(self, index, x):
        if self.size == len(self.items):
            raise OverflowError("array is full")
        if not 0 <= index <= self.size:
            raise IndexError("index out of range")
        for i in range(self.size, index, -1):
            self.items[i] = self.items[i - 1]
        self.items[index] = x
        self.size += 1


a = FixedArray(6)
for x in (10, 20, 30):
    a.append(x)
a.insert(0, 40)
print(a.get(0), a.get(3), a.size)
`,
      },
      js: {
        builtin: `const a = [10, 20, 30];
a.unshift(40);
console.log(a[0], a[3], a.length);
`,
        handmade: `class FixedArray {
  constructor(capacity) {
    this.items = new Array(capacity);
    this.size = 0;
  }
  get(i) {
    if (i < 0 || i >= this.size) throw new RangeError('index out of range');
    return this.items[i];
  }
  append(x) {
    if (this.size === this.items.length) throw new Error('array is full');
    this.items[this.size++] = x;
  }
  insert(index, x) {
    if (this.size === this.items.length) throw new Error('array is full');
    if (index < 0 || index > this.size) throw new RangeError('index out of range');
    for (let i = this.size; i > index; i--) this.items[i] = this.items[i - 1];
    this.items[index] = x;
    this.size++;
  }
}

const a = new FixedArray(6);
for (const x of [10, 20, 30]) a.append(x);
a.insert(0, 40);
console.log(a.get(0), a.get(3), a.size);
`,
      },
      java: {
        builtin: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> a = new ArrayList<>(List.of(10, 20, 30));
        a.add(0, 40);
        System.out.println(a.get(0) + " " + a.get(3) + " " + a.size());
    }
}
`,
        handmade: `public class Main {
    static class FixedArray {
        private final int[] items;
        private int count = 0;

        FixedArray(int capacity) {
            items = new int[capacity];
        }

        int get(int i) {
            if (i < 0 || i >= count) throw new IndexOutOfBoundsException("index out of range");
            return items[i];
        }

        int size() {
            return count;
        }

        void append(int x) {
            if (count == items.length) throw new IllegalStateException("array is full");
            items[count++] = x;
        }

        void insert(int index, int x) {
            if (count == items.length) throw new IllegalStateException("array is full");
            if (index < 0 || index > count) throw new IndexOutOfBoundsException("index out of range");
            for (int i = count; i > index; i--) items[i] = items[i - 1];
            items[index] = x;
            count++;
        }
    }

    public static void main(String[] args) {
        FixedArray a = new FixedArray(6);
        for (int x : new int[] {10, 20, 30}) a.append(x);
        a.insert(0, 40);
        System.out.println(a.get(0) + " " + a.get(3) + " " + a.size());
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> a = {10, 20, 30};
    a.insert(a.begin(), 40);
    std::cout << a[0] << " " << a[3] << " " << a.size() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <stdexcept>

class FixedArray {
    static constexpr int CAPACITY = 6;
    int items[CAPACITY];
    int count = 0;

public:
    int get(int i) const {
        if (i < 0 || i >= count) throw std::out_of_range("index out of range");
        return items[i];
    }
    int size() const { return count; }
    void append(int x) {
        if (count == CAPACITY) throw std::overflow_error("array is full");
        items[count++] = x;
    }
    void insert(int index, int x) {
        if (count == CAPACITY) throw std::overflow_error("array is full");
        if (index < 0 || index > count) throw std::out_of_range("index out of range");
        for (int i = count; i > index; i--) items[i] = items[i - 1];
        items[index] = x;
        count++;
    }
};

int main() {
    FixedArray a;
    for (int x : {10, 20, 30}) a.append(x);
    a.insert(0, 40);
    std::cout << a.get(0) << " " << a.get(3) << " " << a.size() << "\\n";
}
`,
      },
      output: '40 30 4',
    },
    // 陣列：容量 6，一開始 [10, 20, 30]，新放的數字依序 40、50、60…；讀最後一格直接算位置，插到最前面要把每一格往後搬。
    // touched 是這一步動到的格子、moved 是往後搬了幾格（畫圖標色用）；放滿再放是 overflow，格子不變、標色清掉
    sandbox: {
      capacity: 6,
      ops: [{ op: 'read', label: '讀最後一格 a[n−1]' }, { op: 'insertFront', label: '插到最前面 insert' }, { op: 'append', label: '接到最後 append' }],
      errors: { overflow: '6 格都滿了（overflow）。內建的 list、vector 這時會換一塊更大的記憶體，整排搬過去。' },
      init() { return { items: [10, 20, 30], next: 40, got: null, touched: null, moved: 0, error: null }; },
      apply(s, op) {
        const fresh = { ...s, got: null, touched: null, moved: 0, error: null };
        if (op === 'read') { const last = s.items.length - 1; return { ...fresh, got: s.items[last], touched: last }; }
        if (s.items.length >= this.capacity) return { ...fresh, error: 'overflow' };
        if (op === 'insertFront') return { ...fresh, items: [s.next, ...s.items], next: s.next + 10, touched: 0, moved: s.items.length };
        return { ...fresh, items: [...s.items, s.next], next: s.next + 10, touched: s.items.length };
      },
      label(op, s) {
        if (op === 'read') return `a[${s.touched}] → ${s.got}`;
        if (op === 'insertFront') return `insert(0, ${s.items[0]})：搬 ${s.moved} 格`;
        return `append(${s.items[s.items.length - 1]})`;
      },
    },
    // 陣列：一排有編號的置物櫃，6 格都畫出來（空的是虛線），格子下面標索引。這一步動到的那格上黃色；
    // 讀的那格（got 有值）上面寫「直接開」＋往下的箭頭；插到最前面時被往後搬的格子換淺綠色，上面一排 → 從原本的格子指到新的格子
    draw(kit, { items, touched, moved, got }, { sandbox = false } = {}) {
      const { rough, svgEl, svgText, INK, FILL, NEW } = kit, capacity = this.sandbox.capacity;
      const cellW = sandbox ? 46 : 34, cellH = sandbox ? 40 : 32, pad = 8, top = 30;   // 格子上面留 30px 畫箭頭
      const w = capacity * cellW + pad * 2, hgt = top + cellH + 22;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      const left = (i) => pad + i * cellW, mid = (i) => left(i) + cellW / 2;
      const wasMoved = (i) => touched !== null && i > touched && i <= touched + moved;
      for (let i = 0; i < capacity; i++) {
        const box = [left(i) + 2, top + 2, cellW - 4, cellH - 4];
        if (i < items.length) {
          const fill = i === touched ? NEW : wasMoved(i) ? MOVED : FILL;
          s.append(rc.rectangle(...box, { stroke: INK, fill, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 11 + items[i] }));
          svgText(s, mid(i), top + cellH / 2, String(items[i]), sandbox ? 15 : 13);
        } else {
          s.append(rc.rectangle(...box, { stroke: MUTED, strokeWidth: 1, strokeLineDash: [4, 4], roughness: 0.6, seed: 3 + i }));
        }
        svgText(s, mid(i), top + cellH + 11, String(i), 11).style.fill = MUTED;
      }
      for (let i = 1; i < items.length; i++) if (wasMoved(i)) arrow(INK, s, rc, [mid(i - 1) + 5, top - 9], [mid(i) - 5, top - 9], 30 + i);
      if (got !== null) {
        svgText(s, mid(touched), 7, '直接開', 11);
        arrow(INK, s, rc, [mid(touched), 14], [mid(touched), top - 1], 40);
      }
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('array', page);
})(typeof window !== 'undefined' ? window : globalThis);
