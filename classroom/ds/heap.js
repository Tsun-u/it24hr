// classroom/heap.js — 小教室「Heap 堆積」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 沙盒依序放進的七個數，放完剛好是三層填滿的最大堆積
  const SEEDS = [30, 50, 20, 70, 10, 60, 40];

  // 最大堆積用陣列存：第 i 格的爸爸在 (i - 1) / 2（取整數），孩子在 2i + 1、2i + 2。
  // 兩個操作都回傳新的陣列和這一步換過的數，舊的陣列不動
  function siftUp(heap, x) {
    const h = [...heap, x], swapped = [];
    let i = h.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (h[p] >= h[i]) break;
      swapped.push(h[p]);
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
    return { heap: h, swapped };
  }
  function popMax(heap) {
    const h = heap.slice(0, -1), last = heap[heap.length - 1], swapped = [];
    if (!h.length) return { heap: h, top: last, moved: null, swapped };
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let big = i;
      if (l < h.length && h[l] > h[big]) big = l;
      if (r < h.length && h[r] > h[big]) big = r;
      if (big === i) break;
      swapped.push(h[big]);
      [h[i], h[big]] = [h[big], h[i]];
      i = big;
    }
    return { heap: h, top: heap[0], moved: last, swapped };
  }
  const swapsText = (swapped) => swapped.map((v, k) => `${k ? '再' : ''}跟 ${v} 換`).join('、');

  const page = {
    analogy: '急診室：不是先來先看，是最嚴重的先看。',
    summary: '下次在急診室看到護理師先叫最嚴重的人進去，你就知道：那是一個堆積，最大的永遠在最上面。',   // 總結：呼應開頭的比喻
    frames: ['insert', 'insert', 'insert', 'insert', 'extractMax'],
    uses: [
      '醫院急診的檢傷分級：不管誰先到，最嚴重的先看。',
      '外送平台派單、手機的通知：快超時的、緊急的排到最前面。',
      '作業系統排程：優先權高的程式先用 CPU，用的就是優先佇列。',
      { text: '從幾百萬筆分數裡找前 10 名：不用全部排序，留一個只裝 10 個的堆積，邊看邊丟；找最短路徑的 Dijkstra 也用它挑下一個點。', see: 'shortest_path' },
    ],
    concept: [
      '堆積（heap）是一棵完全二元樹：從上到下、從左到右一層一層填，中間不留空位。所以直接用陣列存就好，第 i 格的兩個孩子在 2i + 1、2i + 2，爸爸在 (i − 1) / 2（取整數）。',
      '最大堆積（max heap）規定每個節點都不比它的孩子小，所以最大的永遠在最上面；最小堆積（min heap）反過來。兄弟之間誰大誰小沒有規定。',
      '放進來（insert）：先放在最後一格，再一路跟爸爸比，比爸爸大就換上去（往上浮）。拿最大（extractMax）：拿走最上面那個，把最後一格搬到最上面，再一路跟比較大的孩子換下去（往下沉）。兩個都只走一條從上到下的路，所以是 O(log n)。',
      '優先佇列（priority queue）是「每次拿出優先權最高的」這個規則，堆積是最常見的做法，就像堆疊是規則、陣列是做法之一。',
      '堆積排序（heap sort）：全部放進最大堆積，再一直拿最大的，拿出來的順序就是由大到小。考試手寫的是原地版本：每次把最上面那個跟範圍內的最後一格交換、範圍縮小一格再往下沉，不用另外開陣列，時間是 O(n log n)。',
    ],
    complexity: [['insert 放進', 'O(log n)'], ['extractMax 拿最大', 'O(log n)'], ['peek 看最大', 'O(1)'], ['一次給 n 個，建成堆積', 'O(n)'], ['堆積排序', 'O(n log n)'], ['在最大堆積裡找最小的', 'O(n)']],
    traps: [
      { wrong: '堆積就是排好序的陣列', right: '只保證爸爸不比孩子小，兄弟之間沒有順序。[70, 50, 20, 30, 10] 是最大堆積，但排在 50 後面的 20 比 30 小。' },
      { wrong: '拿走最上面那個以後，把比較大的孩子補上去就好', right: '這樣樹會在中間缺一塊，不再是完全二元樹。正確做法是把最後一格搬到最上面，再往下沉。' },
      { wrong: '最大堆積找最小的也很快', right: '最小的一定在最下面幾個沒有孩子的節點裡，但不知道是哪一個，要全部看過，是 O(n)。要常常拿最小的，就改用最小堆積。' },
      { wrong: '一次給 n 個數，建堆積要 O(n log n)', right: '一個一個放進去才是 O(n log n)。一次給齊的話，從最後一個有孩子的節點往前，一個一個往下沉，整個建好只要 O(n)。' },
      { wrong: '資料結構的堆積，跟記憶體的 heap 是同一個東西', right: '同名不同物。記憶體的 heap 是程式執行時要空間（new、malloc）的地方，跟這棵樹沒有關係。' },
      { wrong: 'Python 的 heapq 是最大堆積', right: 'heapq 是最小堆積，heappop 拿到的是最小的。要最大的，常見寫法是放進去時取負數、拿出來再變回來；Java 的 PriorityQueue 預設也是最小，C++ 的 priority_queue 預設才是最大。' },
    ],
    code: {
      python: {
        builtin: `import heapq

heap = []
for x in (30, 50, 20, 70, 10):
    heapq.heappush(heap, -x)   # heapq 是最小堆積，存負數就變成拿最大的
a = -heapq.heappop(heap)
b = -heapq.heappop(heap)
print(a, b, -heap[0])
`,
        handmade: `class MaxHeap:
    def __init__(self):
        self.items = []

    def push(self, x):
        h = self.items
        h.append(x)
        i = len(h) - 1
        while i > 0:                      # 往上浮：比爸爸大就換上去
            p = (i - 1) // 2
            if h[p] >= h[i]:
                break
            h[p], h[i] = h[i], h[p]
            i = p

    def pop_max(self):
        h = self.items
        if not h:
            raise IndexError("heap underflow")
        top = h[0]
        last = h.pop()
        if h:
            h[0] = last                   # 最後一格搬到最上面，再往下沉
            i = 0
            while True:
                l, r, big = 2 * i + 1, 2 * i + 2, i
                if l < len(h) and h[l] > h[big]:
                    big = l
                if r < len(h) and h[r] > h[big]:
                    big = r
                if big == i:
                    break
                h[i], h[big] = h[big], h[i]
                i = big
        return top

    def peek(self):
        return self.items[0]


heap = MaxHeap()
for x in (30, 50, 20, 70, 10):
    heap.push(x)
a = heap.pop_max()
b = heap.pop_max()
print(a, b, heap.peek())
`,
      },
      js: {
        builtin: `// JavaScript 沒有內建的堆積：這裡用陣列每次排序代替（每拿一次都要排一次，比較慢），考試要自己刻
const items = [];
for (const x of [30, 50, 20, 70, 10]) items.push(x);
const popMax = () => {
  items.sort((p, q) => q - p);
  return items.shift();
};
const a = popMax();
const b = popMax();
console.log(a, b, Math.max(...items));
`,
        handmade: `class MaxHeap {
  constructor() {
    this.items = [];
  }
  push(x) {
    const h = this.items;
    h.push(x);
    let i = h.length - 1;
    while (i > 0) {                     // 往上浮：比爸爸大就換上去
      const p = Math.floor((i - 1) / 2);
      if (h[p] >= h[i]) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  }
  popMax() {
    const h = this.items;
    if (!h.length) throw new Error('heap underflow');
    const top = h[0];
    const last = h.pop();
    if (h.length) {
      h[0] = last;                      // 最後一格搬到最上面，再往下沉
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let big = i;
        if (l < h.length && h[l] > h[big]) big = l;
        if (r < h.length && h[r] > h[big]) big = r;
        if (big === i) break;
        [h[i], h[big]] = [h[big], h[i]];
        i = big;
      }
    }
    return top;
  }
  peek() {
    return this.items[0];
  }
}

const heap = new MaxHeap();
for (const x of [30, 50, 20, 70, 10]) heap.push(x);
const a = heap.popMax();
const b = heap.popMax();
console.log(a, b, heap.peek());
`,
      },
      java: {
        builtin: `import java.util.Collections;
import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        // PriorityQueue 預設是最小堆積，給它反過來的比較方式就變成拿最大的
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int x : new int[] {30, 50, 20, 70, 10}) heap.add(x);
        int a = heap.poll();
        int b = heap.poll();
        System.out.println(a + " " + b + " " + heap.peek());
    }
}
`,
        handmade: `public class Main {
    static class MaxHeap {
        private final int[] items;
        private int size = 0;

        MaxHeap(int capacity) {
            items = new int[capacity];
        }

        private void swap(int i, int j) {
            int t = items[i];
            items[i] = items[j];
            items[j] = t;
        }

        void push(int x) {
            if (size == items.length) throw new IllegalStateException("heap overflow");
            items[size] = x;
            int i = size++;
            while (i > 0) {                   // 往上浮：比爸爸大就換上去
                int p = (i - 1) / 2;
                if (items[p] >= items[i]) break;
                swap(p, i);
                i = p;
            }
        }

        int popMax() {
            if (size == 0) throw new IllegalStateException("heap underflow");
            int top = items[0];
            items[0] = items[--size];         // 最後一格搬到最上面，再往下沉
            int i = 0;
            while (true) {
                int l = 2 * i + 1, r = 2 * i + 2, big = i;
                if (l < size && items[l] > items[big]) big = l;
                if (r < size && items[r] > items[big]) big = r;
                if (big == i) break;
                swap(i, big);
                i = big;
            }
            return top;
        }

        int peek() {
            return items[0];
        }
    }

    public static void main(String[] args) {
        MaxHeap heap = new MaxHeap(7);
        for (int x : new int[] {30, 50, 20, 70, 10}) heap.push(x);
        int a = heap.popMax();
        int b = heap.popMax();
        System.out.println(a + " " + b + " " + heap.peek());
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <queue>

int main() {
    std::priority_queue<int> heap;   // C++ 的 priority_queue 預設就是最大堆積
    for (int x : {30, 50, 20, 70, 10}) heap.push(x);
    int a = heap.top(); heap.pop();
    int b = heap.top(); heap.pop();
    std::cout << a << " " << b << " " << heap.top() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <stdexcept>
#include <utility>

class MaxHeap {
    int items[7];
    int size = 0;

public:
    void push(int x) {
        if (size == 7) throw std::overflow_error("heap overflow");
        items[size] = x;
        int i = size++;
        while (i > 0) {                      // 往上浮：比爸爸大就換上去
            int p = (i - 1) / 2;
            if (items[p] >= items[i]) break;
            std::swap(items[p], items[i]);
            i = p;
        }
    }
    int popMax() {
        if (size == 0) throw std::underflow_error("heap underflow");
        int top = items[0];
        items[0] = items[--size];            // 最後一格搬到最上面，再往下沉
        int i = 0;
        while (true) {
            int l = 2 * i + 1, r = 2 * i + 2, big = i;
            if (l < size && items[l] > items[big]) big = l;
            if (r < size && items[r] > items[big]) big = r;
            if (big == i) break;
            std::swap(items[i], items[big]);
            i = big;
        }
        return top;
    }
    int peek() const { return items[0]; }
};

int main() {
    MaxHeap heap;
    for (int x : {30, 50, 20, 70, 10}) heap.push(x);
    int a = heap.popMax();
    int b = heap.popMax();
    std::cout << a << " " << b << " " << heap.peek() << "\\n";
}
`,
      },
      output: '70 50 30',
    },
    // 沙盒：最大堆積、容量 7。insert 依序放 SEEDS，extractMax 拿走最大的、排到「拿出來」那一列；一直拿到空就是堆積排序
    sandbox: {
      capacity: 7,
      ops: [{ op: 'insert', label: '放進 insert' }, { op: 'extractMax', label: '拿最大 extractMax' }],
      errors: { allPlaced: '七個數都放進去了，按「拿最大」一直拿到空，就是堆積排序。' },
      init() { return { heap: [], placed: 0, out: [], added: null, got: null, moved: null, swapped: [], error: null }; },
      apply(s, op) {
        const noMarks = { added: null, got: null, moved: null, swapped: [] };
        if (op === 'insert') {
          if (s.placed >= SEEDS.length) return { ...s, ...noMarks, error: 'allPlaced' };
          const x = SEEDS[s.placed];
          const { heap, swapped } = siftUp(s.heap, x);
          return { ...s, ...noMarks, heap, placed: s.placed + 1, added: x, swapped, error: null };
        }
        if (!s.heap.length) return { ...s, ...noMarks, error: 'underflow' };
        const { heap, top, moved, swapped } = popMax(s.heap);
        return { ...s, ...noMarks, heap, out: [...s.out, top], got: top, moved, swapped, error: null };
      },
      label(op, s) {
        if (op === 'insert') return `insert(${s.added})${s.swapped.length ? `：${swapsText(s.swapped)}` : ''}`;
        if (s.moved === null) return `extractMax() → ${s.got}`;
        return `extractMax() → ${s.got}：${s.moved} 補到頂，${s.swapped.length ? swapsText(s.swapped) : '不用換'}`;
      },
    },
    // 同一份資料畫兩次：上面是樹、下面是陣列（格子上標索引）。這一步放進來、補到頂、換過的數上黃色；
    // 拿出來的數排在最下面一列，一直拿到空就是由大到小。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { heap, out, added, moved, swapped }, { sandbox = false } = {}) {
      const w = sandbox ? 300 : 240, r = sandbox ? 16 : 13, gap = sandbox ? 50 : 40, pad = r + 8;
      const cell = sandbox ? 34 : 28, arrY = pad + gap * 2 + r + 26, outY = arrY + cell + 20, hgt = outY + (out.length ? 14 : 0) + 6;
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);
      const hot = new Set([added, moved, ...swapped].filter(v => v !== null));
      const xy = (i) => { const d = Math.floor(Math.log2(i + 1)), slot = i + 1 - 2 ** d; return [pad + ((slot + 0.5) * (w - pad * 2)) / 2 ** d, pad + d * gap]; };
      if (!heap.length) {
        svg.append(rc.circle(w / 2, pad, r * 2, { stroke: INK, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 2 }));
        svgText(svg, w / 2, pad + r + 14, '空的堆積', 12);
      }
      heap.forEach((_, i) => { if (i) svg.append(rc.line(...xy(Math.floor((i - 1) / 2)), ...xy(i), { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 30 + i })); });
      heap.forEach((v, i) => {
        const [x, y] = xy(i);
        svg.append(rc.circle(x, y, r * 2, { stroke: INK, fill: hot.has(v) ? NEW : FILL, fillStyle: 'solid', roughness: 1, seed: v }));
        svgText(svg, x, y, String(v), sandbox ? 14 : 12);
      });
      // 陣列：七格，索引標在格子上面
      const left = (w - cell * 7) / 2;
      for (let i = 0; i < 7; i++) {
        const x = left + i * cell, v = heap[i];
        svg.append(rc.rectangle(x, arrY, cell, cell, { stroke: INK, fill: v === undefined ? undefined : hot.has(v) ? NEW : FILL, fillStyle: 'hachure', hachureGap: 5, roughness: 0.8, seed: 70 + i }));
        svgText(svg, x + cell / 2, arrY - 8, String(i), 10);
        if (v !== undefined) svgText(svg, x + cell / 2, arrY + cell / 2, String(v), sandbox ? 13 : 11);
      }
      if (out.length) svgText(svg, w / 2, outY, `拿出來：${out.join(' ')}`, sandbox ? 12 : 11);
      return svg;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'heap', page);
})(typeof window !== 'undefined' ? window : globalThis);
