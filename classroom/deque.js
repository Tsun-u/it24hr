// classroom/deque.js — 小教室「Deque 雙向佇列」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    stamp: 'deque',
    analogy: '前後門都能上下車的公車：哪一頭都能進，哪一頭都能出。',
    summary: '下次搭到前後門都能上下車的公車，你就知道：那是一個雙向佇列，哪一頭都能進，哪一頭都能出。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['pushBack', 'pushBack', 'pushFront', 'popFront', 'popBack'],
    game: '結算卡蓋 Deque，是因為你兩頭都拿：動手做的卡裡，最新進來的加上最早那張至少占八成，而且兩種各至少三成，中間那幾張很少碰。你的看板就是一條雙向佇列：做最新的是 popFront，回頭補最早的是 popBack。至於印章那句——這條 deque 的前端沒做權限控管，老闆的急件、隔壁的「順便幫我看一下」，誰都能 pushFront。',
    uses: [
      '排隊的時候：急件插到最前面，等不下去的人從隊尾離開，兩頭都有人進出。',
      '文書軟體的復原紀錄只記最近幾十步：新動作從一頭疊上去、Ctrl+Z 也從這頭退；記滿了，最舊的那步從另一頭丟掉。',
      '判斷一句話是不是回文（「上海自來水來自海上」）：從頭尾各拿一個字來比，一路比到中間。',
      '多執行緒分工（work stealing）：每條執行緒從自己那條雙向佇列的一頭拿工作，閒下來的就從別人那條的另一頭「偷」工作來做；Java 的 ForkJoinPool 就是這樣排工作的。',
    ],
    concept: [
      'Deque 是 Double-Ended Queue（兩頭都能用的佇列）的縮寫，中文叫雙向佇列，唸作「deck」。',
      '它有前端（front）和後端（back，也常寫成 rear）兩個口，兩個口都能放、也都能拿，所以有四個操作：pushFront、pushBack、popFront、popBack。中間的東西碰不到，只能動兩頭。',
      '只用其中一頭進出，它就是堆疊 Stack（LIFO，後進先出）；一頭進、另一頭出，它就是佇列 Queue（FIFO，先進先出）。所以 Deque 是前兩頁的通才，堆疊和佇列能做的事它都能做。',
    ],
    // 各操作的時間複雜度（Big-O 的定義與怎麼算在附錄）
    complexity: [['pushFront 前面放', 'O(1)'], ['pushBack 後面放', 'O(1)'], ['popFront 前面拿', 'O(1)'], ['popBack 後面拿', 'O(1)'], ['看最前面／最後面', 'O(1)'], ['找某個值在不在裡面', 'O(n)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      '「deque 就是 dequeue 少打一個 u」——不是。deque 是 Double-Ended Queue 的縮寫、唸「deck」，指的是這個資料結構；dequeue 是佇列「叫號」那個動作。差一個字母，一個是東西、一個是動作。',
      '「從前面放進去的，也會排到最後面」——不對，pushFront 放的就在最前面，下一次 popFront 拿到的就是它。連續從前面放 1、2、3，從前面數過來是 3、2、1：只用前端的話，它就是一個堆疊。',
      '「Python 的 deque 拿東西就用 pop()」——其實 pop() 拿的是右邊（後端），從左邊（前端）拿要用 popleft()；放也一樣，append() 放右邊、appendleft() 放左邊。拿來當佇列卻寫成 pop()，不會報錯，只是佇列默默變成了堆疊。',
      '「JavaScript 陣列的 unshift／shift 跟 push／pop 一樣快」——其實 push／pop 動的是尾巴，O(1)；unshift／shift 動的是開頭，後面每一格都得挪一個位置，是 O(n)。資料少看不出來，筆數一多就慢；兩頭都要快，就照下面「自己刻」的寫。',
      '「Deque 一定是用鏈結串列做的」——其實環狀陣列也行，下面「自己刻」就是。Java 的 ArrayDeque 是環狀陣列，Python 的 deque 是一段段小陣列用雙向鏈結串起來。Deque 說的是「兩頭都能進出」這個規則，不是東西怎麼存。',
      '「front 往前退一格，寫 (front − 1) % n 就好」——其實只有 Python 會得到 n − 1；C++、Java、JavaScript 的 % 會保留負號，(0 − 1) % 6 是 −1，索引直接超出範圍（JavaScript 還不報錯，默默存進一個叫 -1 的屬性）。寫成 (front − 1 + n) % n，四種語言都對。',
    ],
    code: {
      python: {
        builtin: `from collections import deque

d = deque()
d.append(1)        # 後面放（Python 叫右邊）
d.append(2)
d.appendleft(0)    # 前面放（Python 叫左邊）
a = d.popleft()    # 前面拿
b = d.pop()        # 後面拿
print(a, b, d[0])
`,
        handmade: `class Deque:
    # 環狀陣列：front 是最前面那個的格號，size 是現在有幾個；多記 size 就分得出空和滿
    def __init__(self, capacity):
        self.items = [None] * capacity
        self.capacity = capacity
        self.front = 0
        self.size = 0

    def push_front(self, x):
        if self.size == self.capacity:
            raise OverflowError("deque overflow")
        # 往前退一格，退過 0 號格就繞到最後一格；+ capacity 讓四種語言寫法一樣
        self.front = (self.front - 1 + self.capacity) % self.capacity
        self.items[self.front] = x
        self.size += 1

    def push_back(self, x):
        if self.size == self.capacity:
            raise OverflowError("deque overflow")
        self.items[(self.front + self.size) % self.capacity] = x
        self.size += 1

    def pop_front(self):
        if self.size == 0:
            raise IndexError("deque underflow")
        x = self.items[self.front]
        self.front = (self.front + 1) % self.capacity
        self.size -= 1
        return x

    def pop_back(self):
        if self.size == 0:
            raise IndexError("deque underflow")
        self.size -= 1
        return self.items[(self.front + self.size) % self.capacity]

    def peek_front(self):
        return self.items[self.front]


d = Deque(6)
d.push_back(1)
d.push_back(2)
d.push_front(0)
a = d.pop_front()
b = d.pop_back()
print(a, b, d.peek_front())
`,
      },
      js: {
        builtin: `// JS 沒有內建雙向佇列，最接近的是陣列：push／pop 動尾巴、unshift／shift 動開頭；
// 動開頭要把整排挪一格，資料多時改用自己刻的
const d = [];
d.push(1);             // 後面放
d.push(2);
d.unshift(0);          // 前面放
const a = d.shift();   // 前面拿
const b = d.pop();     // 後面拿
console.log(a, b, d[0]);
`,
        handmade: `// 環狀陣列：front 是最前面那個的格號，size 是現在有幾個；多記 size 就分得出空和滿
class Deque {
  constructor(capacity) {
    this.items = new Array(capacity);
    this.capacity = capacity;
    this.front = 0;
    this.size = 0;
  }
  pushFront(x) {
    if (this.size === this.capacity) throw new Error('deque overflow');
    // 往前退一格，退過 0 號格就繞到最後一格；JS 的 % 會保留負號，所以要先 + capacity
    this.front = (this.front - 1 + this.capacity) % this.capacity;
    this.items[this.front] = x;
    this.size++;
  }
  pushBack(x) {
    if (this.size === this.capacity) throw new Error('deque overflow');
    this.items[(this.front + this.size) % this.capacity] = x;
    this.size++;
  }
  popFront() {
    if (this.size === 0) throw new Error('deque underflow');
    const x = this.items[this.front];
    this.front = (this.front + 1) % this.capacity;
    this.size--;
    return x;
  }
  popBack() {
    if (this.size === 0) throw new Error('deque underflow');
    this.size--;
    return this.items[(this.front + this.size) % this.capacity];
  }
  peekFront() {
    return this.items[this.front];
  }
}

const d = new Deque(6);
d.pushBack(1);
d.pushBack(2);
d.pushFront(0);
const a = d.popFront();
const b = d.popBack();
console.log(a, b, d.peekFront());
`,
      },
      java: {
        builtin: `import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> d = new ArrayDeque<>();
        d.offerLast(1);            // 後面放
        d.offerLast(2);
        d.offerFirst(0);           // 前面放
        int a = d.pollFirst();     // 前面拿
        int b = d.pollLast();      // 後面拿
        System.out.println(a + " " + b + " " + d.peekFirst());
    }
}
`,
        handmade: `public class Main {
    // 環狀陣列：front 是最前面那個的格號，size 是現在有幾個；多記 size 就分得出空和滿
    static class Deque {
        private final int[] items;
        private int front = 0, size = 0;

        Deque(int capacity) {
            items = new int[capacity];
        }

        void pushFront(int x) {
            if (size == items.length) throw new IllegalStateException("deque overflow");
            // 往前退一格，退過 0 號格就繞到最後一格；Java 的 % 會保留負號，所以要先 + 長度
            front = (front - 1 + items.length) % items.length;
            items[front] = x;
            size++;
        }

        void pushBack(int x) {
            if (size == items.length) throw new IllegalStateException("deque overflow");
            items[(front + size) % items.length] = x;
            size++;
        }

        int popFront() {
            if (size == 0) throw new IllegalStateException("deque underflow");
            int x = items[front];
            front = (front + 1) % items.length;
            size--;
            return x;
        }

        int popBack() {
            if (size == 0) throw new IllegalStateException("deque underflow");
            size--;
            return items[(front + size) % items.length];
        }

        int peekFront() {
            return items[front];
        }
    }

    public static void main(String[] args) {
        Deque d = new Deque(6);
        d.pushBack(1);
        d.pushBack(2);
        d.pushFront(0);
        int a = d.popFront();
        int b = d.popBack();
        System.out.println(a + " " + b + " " + d.peekFront());
    }
}
`,
      },
      cpp: {
        builtin: `#include <deque>
#include <iostream>

int main() {
    std::deque<int> d;
    d.push_back(1);     // 後面放
    d.push_back(2);
    d.push_front(0);    // 前面放
    int a = d.front(); d.pop_front();   // 前面拿：pop_front 不回傳值，要先用 front 看
    int b = d.back(); d.pop_back();     // 後面拿
    std::cout << a << " " << b << " " << d.front() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <stdexcept>

// 環狀陣列：front 是最前面那個的格號，size 是現在有幾個；多記 size 就分得出空和滿
class Deque {
    static constexpr int capacity = 6;
    int items[capacity];
    int front = 0;
    int size = 0;

public:
    void pushFront(int x) {
        if (size == capacity) throw std::overflow_error("deque overflow");
        // 往前退一格，退過 0 號格就繞到最後一格；C++ 的 % 會保留負號，所以要先 + capacity
        front = (front - 1 + capacity) % capacity;
        items[front] = x;
        size++;
    }
    void pushBack(int x) {
        if (size == capacity) throw std::overflow_error("deque overflow");
        items[(front + size) % capacity] = x;
        size++;
    }
    int popFront() {
        if (size == 0) throw std::underflow_error("deque underflow");
        int x = items[front];
        front = (front + 1) % capacity;
        size--;
        return x;
    }
    int popBack() {
        if (size == 0) throw std::underflow_error("deque underflow");
        size--;
        return items[(front + size) % capacity];
    }
    int peekFront() const { return items[front]; }
};

int main() {
    Deque d;
    d.pushBack(1);
    d.pushBack(2);
    d.pushFront(0);
    int a = d.popFront();
    int b = d.popBack();
    std::cout << a << " " << b << " " << d.peekFront() << "\\n";
}
`,
      },
      output: '0 2 1',
    },
    // 沙盒：容量 6，一開始空的。前面放 0、−1、−2…往前長，後面放 1、2、3…往後長；
    // end 記這一步動到哪一頭（畫圖標色用），got 是這一步拿出來的值；空的拿是 underflow、滿了放是 overflow
    sandbox: {
      capacity: 6,
      ops: [{ op: 'pushFront', label: '前面放 pushFront' }, { op: 'pushBack', label: '後面放 pushBack' }, { op: 'popFront', label: '前面拿 popFront' }, { op: 'popBack', label: '後面拿 popBack' }],
      init() { return { items: [], nextFront: 0, nextBack: 1, end: null, got: null, error: null }; },
      apply(s, op) {
        if (op === 'pushFront' || op === 'pushBack') {
          if (s.items.length >= this.capacity) return { ...s, end: null, got: null, error: 'overflow' };
          if (op === 'pushFront') return { ...s, items: [s.nextFront, ...s.items], nextFront: s.nextFront - 1, end: 'front', got: null, error: null };
          return { ...s, items: [...s.items, s.nextBack], nextBack: s.nextBack + 1, end: 'back', got: null, error: null };
        }
        if (!s.items.length) return { ...s, end: null, got: null, error: 'underflow' };
        if (op === 'popFront') return { ...s, items: s.items.slice(1), end: 'front', got: s.items[0], error: null };
        return { ...s, items: s.items.slice(0, -1), end: 'back', got: s.items[s.items.length - 1], error: null };
      },
      label(op, s) {
        if (op === 'pushFront') return `pushFront(${s.items[0]})`;
        if (op === 'pushBack') return `pushBack(${s.items[s.items.length - 1]})`;
        return `${op}() → ${s.got}`;
      },
    },
    // 橫的管子，兩端都開口、各畫一進一出的箭頭，左 front、右 back；東西置中排。
    // 放進來的那格上黃色；拿出來的那個畫在管子外面、它離開的那一頭，也上黃色
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { items, end, got }) {
      const capacity = 6, boxW = 30, side = 66, width = capacity * boxW + side * 2, hgt = 74, top = 14, bot = 50;
      const s = svgEl(width, hgt); const rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 1.2 };
      s.append(rc.line(side - 6, top, width - side + 6, top, { ...line, seed: 7 }));
      s.append(rc.line(side - 6, bot, width - side + 6, bot, { ...line, seed: 8 }));
      const arrow = (from, to, y, seed) => {
        const thin = { stroke: INK, strokeWidth: 1.3, roughness: 0.8, seed }, dir = Math.sign(to - from);
        s.append(rc.line(from, y, to, y, thin));
        s.append(rc.linearPath([[to - dir * 6, y - 4], [to, y], [to - dir * 6, y + 4]], thin));
      };
      arrow(side - 30, side - 8, top + 8, 31); arrow(side - 8, side - 30, bot - 8, 32);                       // front：上面進、下面出
      arrow(width - side + 30, width - side + 8, top + 8, 33); arrow(width - side + 8, width - side + 30, bot - 8, 34);   // back：上面進、下面出
      const box = (x, v, fill, extra = {}) => {
        s.append(rc.rectangle(x + 2, top + 5, boxW - 4, bot - top - 10, { stroke: INK, fill, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 11 + Math.abs(v), ...extra }));   // seed 是 0 時 rough.js 會改用亂數，前面放的是負數要取絕對值
        svgText(s, x + boxW / 2, (top + bot) / 2, String(v));
      };
      const x0 = side + (capacity - items.length) * boxW / 2;
      const popped = got !== null;
      items.forEach((v, i) => {
        const fresh = !popped && ((end === 'front' && i === 0) || (end === 'back' && i === items.length - 1));
        box(x0 + i * boxW, v, fresh ? NEW : FILL);
      });
      if (popped) box(end === 'front' ? 3 : width - boxW - 3, got, NEW, { strokeLineDash: [4, 3] });
      svgText(s, side, hgt - 10, 'front', 11); svgText(s, width - side, hgt - 10, 'back', 11);
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('deque', page);
})(typeof window !== 'undefined' ? window : globalThis);
