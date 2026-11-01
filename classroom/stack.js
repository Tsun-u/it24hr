// classroom/stack.js — 小教室「Stack 堆疊」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const DISK_FILL = ['#9cc3f5', '#b5e3b0', '#f5b8c4', '#c9b8f5'];
  // 河內塔的畫面：三根柱子、盤子照大小畫寬度；拿起來的那片浮在那根柱子上面、上黃色
  function drawHanoi({ rough, svgEl, svgText, INK, NEW }, s, w = 360) {
    const diskH = 24, hgt = (s.n + 3) * diskH + 18, base = hgt - 16, pegX = [w / 6, w / 2, (w * 5) / 6], pegTop = base - (s.n + 1.5) * diskH;
    const svg = svgEl(w, hgt); const rc = rough.svg(svg);
    svg.append(rc.line(8, base, w - 8, base, { stroke: INK, strokeWidth: 2, roughness: 1, seed: 3 }));
    pegX.forEach((x, i) => { svg.append(rc.line(x, base, x, pegTop, { stroke: INK, strokeWidth: 2, roughness: 0.8, seed: 5 + i })); svgText(svg, x, base + 9, 'ABC'[i], 12); });
    const diskW = (size) => 26 + size * ((w / 3 - 34) / s.n);
    const disk = (x, y, size, held) => {
      svg.append(rc.rectangle(x - diskW(size) / 2, y, diskW(size), diskH - 3,
        { stroke: INK, fill: held ? NEW : DISK_FILL[(size - 1) % DISK_FILL.length], fillStyle: 'solid', roughness: 1, seed: 20 + size }));   // 實心才蓋得住後面的柱子
      svgText(svg, x, y + (diskH - 3) / 2, String(size), 14);
    };
    s.pegs.forEach((peg, i) => peg.forEach((size, k) => {
      const held = s.from === i && k === peg.length - 1;
      disk(pegX[i], held ? pegTop - diskH - 4 : base - (k + 1) * diskH, size, held);
    }));
    return svg;
  }

  const page = {
    stamp: 'stack',
    analogy: '一疊盤子：最後放上去的，最先被拿走。',
    summary: '下次看到一疊盤子、按下 Ctrl+Z，你就知道：那是一個堆疊，最後放上去的最先被拿走。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['push', 'push', 'push', 'pop', 'push', 'pop'],
    game: '結算卡蓋 Stack，是因為你總是先做最新進來的卡：看板一來新卡你就去做它，早上那張一直壓在最底下。跟盤子一樣，最早放的最晚被拿到。',
    uses: [
      '文書軟體的復原（Ctrl+Z）：每做一個動作疊一筆，復原從最新的那筆開始退。',
      '瀏覽器的「上一頁」：每開一頁就疊上去，按上一頁就把最上面那頁拿掉。',
      '檢查括號有沒有配對、把算式從中序轉成後序：編譯器和計算機都靠它。',
      '程式呼叫函式：呼叫時疊上一層，做完就拿掉、回到上一層。程式當掉時印出的那一長串就是它（call stack）。',
    ],
    concept: [
      '堆疊只有一個出入口，叫頂端（top）。東西只能從頂端放進去，也只能從頂端拿出來。',
      '所以最後放進去的會最先出來，這個特性叫 LIFO（Last In, First Out，後進先出）。',
      '河內塔是最經典的堆疊模型：三根柱子各是一個堆疊，每次只能搬最上面那片，大的不能壓在小的上面。',
    ],
    // 各操作的時間複雜度（Big-O 的定義與怎麼算在附錄 D）
    complexity: [['push 放進', 'O(1)'], ['pop 拿出', 'O(1)'], ['peek 看頂端', 'O(1)'], ['找某個值在不在裡面', 'O(n)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: 'pop 會把最下面那個拿出來', right: 'pop 永遠拿最上面、也就是最後放進去的那個。' },
      { wrong: 'peek 跟 pop 一樣', right: 'peek 只是看一眼最上面是誰，東西還留在堆疊裡；pop 才會真的拿走。' },
      { wrong: '依序放進 1、2、3，拿出來一定是 3、2、1', right: '不一定。可以邊放邊拿：放 1、拿 1、放 2、放 3、拿 3、拿 2，拿出來是 1、3、2。但不管怎麼穿插，都不可能拿出 3、1、2。' },
      { wrong: '堆疊就是陣列', right: '陣列只是其中一種做法，用鏈結串列也能做。堆疊說的是「只能從頂端進出」這個規則，不是東西怎麼存。' },
      { wrong: '空的時候再拿也沒關係', right: '這叫 underflow。Python、Java 會直接報錯，C++ 的 std::stack 不檢查（結果無法預期），JavaScript 的陣列則默默回傳 undefined，更難發現。拿之前要先檢查是不是空的。' },
      { wrong: '河內塔多一片，只是多搬幾步', right: '每多一片，步數會翻倍再加一：3 片 7 步、4 片 15 步、10 片就要 1023 步（2ⁿ − 1）。' },
    ],
    code: {
      python: {
        builtin: `stack = []
stack.append(1)
stack.append(2)
stack.append(3)
a = stack.pop()
b = stack.pop()
print(a, b, stack[-1])
`,
        handmade: `class Stack:
    def __init__(self, capacity):
        self.items = [None] * capacity
        self.top = -1

    def push(self, x):
        if self.top + 1 == len(self.items):
            raise OverflowError("stack overflow")
        self.top += 1
        self.items[self.top] = x

    def pop(self):
        if self.top == -1:
            raise IndexError("stack underflow")
        x = self.items[self.top]
        self.top -= 1
        return x

    def peek(self):
        return self.items[self.top]


s = Stack(6)
for x in (1, 2, 3):
    s.push(x)
a = s.pop()
b = s.pop()
print(a, b, s.peek())
`,
      },
      js: {
        builtin: `const stack = [];
stack.push(1);
stack.push(2);
stack.push(3);
const a = stack.pop();
const b = stack.pop();
console.log(a, b, stack[stack.length - 1]);
`,
        handmade: `class Stack {
  constructor(capacity) {
    this.items = new Array(capacity);
    this.top = -1;
  }
  push(x) {
    if (this.top + 1 === this.items.length) throw new Error('stack overflow');
    this.items[++this.top] = x;
  }
  pop() {
    if (this.top === -1) throw new Error('stack underflow');
    return this.items[this.top--];
  }
  peek() {
    return this.items[this.top];
  }
}

const s = new Stack(6);
for (const x of [1, 2, 3]) s.push(x);
const a = s.pop();
const b = s.pop();
console.log(a, b, s.peek());
`,
      },
      java: {
        builtin: `import java.util.ArrayDeque;

public class Main {
    public static void main(String[] args) {
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);
        int a = stack.pop();
        int b = stack.pop();
        System.out.println(a + " " + b + " " + stack.peek());
    }
}
`,
        handmade: `public class Main {
    static class Stack {
        private final int[] items;
        private int top = -1;

        Stack(int capacity) {
            items = new int[capacity];
        }

        void push(int x) {
            if (top + 1 == items.length) throw new IllegalStateException("stack overflow");
            items[++top] = x;
        }

        int pop() {
            if (top == -1) throw new IllegalStateException("stack underflow");
            return items[top--];
        }

        int peek() {
            return items[top];
        }
    }

    public static void main(String[] args) {
        Stack s = new Stack(6);
        for (int x : new int[] {1, 2, 3}) s.push(x);
        int a = s.pop();
        int b = s.pop();
        System.out.println(a + " " + b + " " + s.peek());
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <stack>

int main() {
    std::stack<int> stack;
    stack.push(1);
    stack.push(2);
    stack.push(3);
    int a = stack.top(); stack.pop();
    int b = stack.top(); stack.pop();
    std::cout << a << " " << b << " " << stack.top() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <stdexcept>

class Stack {
    int items[6];
    int top = -1;

public:
    void push(int x) {
        if (top + 1 == 6) throw std::overflow_error("stack overflow");
        items[++top] = x;
    }
    int pop() {
        if (top == -1) throw std::underflow_error("stack underflow");
        return items[top--];
    }
    int peek() const { return items[top]; }
};

int main() {
    Stack s;
    for (int x : {1, 2, 3}) s.push(x);
    int a = s.pop();
    int b = s.pop();
    std::cout << a << " " << b << " " << s.peek() << "\\n";
}
`,
      },
      output: '3 2 1',
    },
    // 沙盒：容量 6 用陣列刻；push 放下一個數字，pop 從頂端拿；空的 pop 是 underflow、滿了 push 是 overflow
    sandbox: {
      capacity: 6,
      ops: [{ op: 'push', label: '放進 push' }, { op: 'pop', label: '拿出 pop' }],
      init() { return { items: [], next: 1, got: null, error: null }; },
      apply(s, op) {
        if (op === 'push') {
          if (s.items.length >= this.capacity) return { ...s, got: null, error: 'overflow' };
          return { items: [...s.items, s.next], next: s.next + 1, got: null, error: null };
        }
        if (!s.items.length) return { ...s, got: null, error: 'underflow' };
        return { ...s, items: s.items.slice(0, -1), got: s.items[s.items.length - 1], error: null };
      },
      label(op, s) { return op === 'push' ? `push(${s.items[s.items.length - 1]})` : `pop() → ${s.got}`; },
    },
    // 一個開口朝上的容器，盒子從底往上疊，最上面那個（top）上黃色；seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { items }, { sandbox = false } = {}) {
      const capacity = 6, w = sandbox ? 120 : 92, boxH = 26, pad = 8, hgt = capacity * boxH + pad * 2 + 6;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      const left = 12, right = w - 12, bottom = hgt - pad;
      s.append(rc.linearPath([[left, pad], [left, bottom], [right, bottom], [right, pad]], { stroke: INK, strokeWidth: 1.6, roughness: 1.2, seed: 7 }));
      items.forEach((v, i) => {
        const y = bottom - (i + 1) * boxH;
        s.append(rc.rectangle(left + 5, y + 2, right - left - 10, boxH - 4,
          { stroke: INK, fill: i === items.length - 1 ? NEW : FILL, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 11 + v }));
        svgText(s, w / 2, y + boxH / 2, String(v));
      });
      return s;
    },
    // 經典模型：河內塔（Stack 最經典的模型）。三根柱子各是一個堆疊，數字是盤子大小、陣列尾巴是最上面。
    // 點一根拿起最上面那片、再點一根放下；點同一根是放回去。大的不能疊在小的上面；全部搬到最右邊那根就完成
    classic: {
      init(n = 3) { return { n, pegs: [Array.from({ length: n }, (_, i) => n - i), [], []], from: null, moves: 0, error: null, done: false }; },
      min(n) { return 2 ** n - 1; },
      apply(s, peg) {
        if (s.done) return s;
        if (s.from === null) {
          if (!s.pegs[peg].length) return { ...s, error: 'empty' };
          return { ...s, from: peg, error: null };
        }
        if (peg === s.from) return { ...s, from: null, error: null };
        const disk = s.pegs[s.from].at(-1), top = s.pegs[peg].at(-1);
        if (top !== undefined && top < disk) return { ...s, from: null, error: 'bigger' };
        const pegs = s.pegs.map((p, i) => (i === s.from ? p.slice(0, -1) : i === peg ? [...p, disk] : p));
        return { ...s, pegs, from: null, moves: s.moves + 1, error: null, done: pegs[2].length === s.n };
      },
      // 可以玩的河內塔：點畫面或下面的柱子鈕操作，3／4 片可以重來
      node(kit) {
        const H = this, { h } = kit; let s = H.init(3);
        const wrap = h('div', 'cr-hanoi'); const stage = h('div', 'cr-stage'); const note = h('p', 'cr-note mono');
        const ERR = { empty: '那根柱子是空的，沒東西可以拿。', bigger: '大的不能疊在小的上面，那片放回去了。' };
        const say = () => {
          note.textContent = s.done ? `完成！搬了 ${s.moves} 步，最少要 ${H.min(s.n)} 步${s.moves === H.min(s.n) ? '——一步都沒浪費。' : '。'}`
            : s.error ? ERR[s.error] : s.from !== null ? `拿起 ${'ABC'[s.from]} 最上面那片，點要放的柱子（點同一根放回去）。`
            : `把整疊搬到 C。搬了 ${s.moves} 步（最少 ${H.min(s.n)} 步）。`;
        };
        const draw = () => {
          const svg = drawHanoi(kit, s); svg.classList.add('cr-hanoi-svg');
          svg.addEventListener('click', (e) => { const r = svg.getBoundingClientRect(); act(Math.min(2, Math.floor(((e.clientX - r.left) / r.width) * 3))); });
          stage.replaceChildren(svg); say();
        };
        const act = (peg) => { s = H.apply(s, peg); draw(); };
        const pegs = h('div', 'cr-ops');
        for (let i = 0; i < 3; i++) { const b = h('button', 'btn', `柱子 ${'ABC'[i]}`); b.type = 'button'; b.addEventListener('click', () => act(i)); pegs.append(b); }
        const sizes = h('div', 'cr-ops');
        for (const n of [3, 4]) { const b = h('button', 'btn ghost', `${n} 片重來`); b.type = 'button'; b.addEventListener('click', () => { s = H.init(n); draw(); }); sizes.append(b); }
        draw();
        wrap.append(h('p', 'cr-sub', '河內塔：三根柱子各是一個堆疊，只能拿最上面那片。'), stage, pegs, sizes, note);
        return wrap;
      },
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('stack', page);
})(typeof window !== 'undefined' ? window : globalThis);
